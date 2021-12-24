import path from 'path';
import express from 'express';
import browserSync from 'browser-sync';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import errorOverlayMiddleware from 'react-dev-utils/errorOverlayMiddleware';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { forEach } from 'lodash/fp';
import getConfig from '../config';
import clientConfig from '../webpack/client';
import serverConfig from '../webpack/server';
import run, { format } from './run';
import clean from './clean';

const isDebug = process.env.NODE_ENV !== 'production';

function createCompilationPromise(name, compiler, config) {
  return new Promise((resolve, reject) => {
    let timeStart = new Date();
    compiler.hooks.compile.tap(name, () => {
      timeStart = new Date();
      console.info(`[${format(timeStart)}] Compiling '${name}'...`);
    });

    compiler.hooks.done.tap(name, (stats) => {
      console.info(stats.toString(config.stats));
      const timeEnd = new Date();
      const time = timeEnd.getTime() - timeStart.getTime();
      if (stats.hasErrors()) {
        console.info(
          `[${format(timeEnd)}] Failed to compile '${name}' after ${time} ms`,
        );
        reject(new Error('Compilation failed!'));
      } else {
        console.info(
          `[${format(timeEnd)}] Finished '${name}' compilation after ${time} ms`,
        );
        resolve(stats);
      }
    });
  });
}

let server;
const notPolyfill = (entry) => entry !== 'core-js/stable' && entry !== 'regenerator-runtime/runtime';
const notNullLoader = ({ loader }) => loader !== 'null-loader';

/**
 * Launches a development web server with "live reload" functionality -
 * synchronizing URLs, interactions and code changes across multiple devices.
 */
async function start() {
  if (server) return server;
  server = express();
  server.use(errorOverlayMiddleware());
  server.use(express.static(path.resolve('./public')));
  const proxiesConfig = getConfig('proxies');
  if (proxiesConfig && proxiesConfig.length > 0) {
    forEach(({ from, ...proxyOptions }) => {
      // eslint-disable-next-line
      console.log(`Proxy for: ${from}`);
      server.use(from, createProxyMiddleware(proxyOptions));
    })(proxiesConfig);
  }

  const proxyConfig = getConfig('proxy');
  if ((!proxiesConfig || proxiesConfig.length === 0) && proxyConfig) {
    const { from, ...proxyOptions } = proxyConfig;
    // eslint-disable-next-line
    console.log(`Proxy for: ${from}`);
    server.use(from, createProxyMiddleware(proxyOptions));
  }

  // Configure client-side hot module replacement
  clientConfig.entry.client = [...clientConfig.entry.client, path.resolve(__dirname, './lib/webpackHotDevClient.js')];
  clientConfig.output.filename = clientConfig.output.filename.replace(
    'chunkhash',
    'fullhash',
  );
  clientConfig.output.chunkFilename = clientConfig.output.chunkFilename.replace(
    'chunkhash',
    'fullhash',
  );
  clientConfig.module.rules = clientConfig.module.rules.filter(
    (x) => x.loader !== 'null-loader',
  );
  clientConfig.plugins.push(
    new webpack.HotModuleReplacementPlugin(),
  );

  // Configure server-side hot module replacement
  serverConfig.output.hotUpdateMainFilename = 'updates/[fullhash].hot-update.json';
  serverConfig.output.hotUpdateChunkFilename = 'updates/[id].[fullhash].hot-update.js';
  serverConfig.module.rules = serverConfig.module.rules.filter(notNullLoader);
  serverConfig.plugins.push(
    new webpack.HotModuleReplacementPlugin(),
  );
  serverConfig.entry.server = serverConfig.entry.server.filter(notPolyfill);

  // Configure compilation
  await run(clean);
  const clientCompiler = webpack(clientConfig);
  const serverCompiler = webpack(serverConfig);
  const clientPromise = createCompilationPromise(
    'client',
    clientCompiler,
    clientConfig,
  );
  const serverPromise = createCompilationPromise(
    'server',
    serverCompiler,
    serverConfig,
  );

  // https://github.com/webpack/webpack-dev-middleware
  server.use(webpackDevMiddleware(clientCompiler));

  // https://github.com/glenjamin/webpack-hot-middleware
  server.use(webpackHotMiddleware(clientCompiler, { log: false }));

  let appPromise;
  let appPromiseResolve;
  let appPromiseIsResolved = true;
  serverCompiler.hooks.compile.tap('server', () => {
    if (!appPromiseIsResolved) return;
    appPromiseIsResolved = false;
    // eslint-disable-next-line no-return-assign
    appPromise = new Promise((resolve) => (appPromiseResolve = resolve));
  });

  let app;
  server.use((req, res) => {
    appPromise
      .then(() => app.handle(req, res))
      .catch((error) => console.error(error));
  });

  function checkForUpdate(fromUpdate) {
    const hmrPrefix = '[\x1b[35mHMR\x1b[0m] ';
    if (!app.hot) {
      throw new Error(`${hmrPrefix}Hot Module Replacement is disabled.`);
    }
    if (app.hot.status() !== 'idle') {
      return Promise.resolve();
    }
    return app.hot
      .check(true)
      .then((updatedModules) => {
        if (!updatedModules) {
          if (fromUpdate) {
            console.info(`${hmrPrefix}Update applied.`);
          }
          return;
        }
        if (updatedModules.length === 0) {
          console.info(`${hmrPrefix}Nothing hot updated.`);
        } else {
          console.info(`${hmrPrefix}Updated modules:`);
          updatedModules.forEach((moduleId) => console.info(`${hmrPrefix} - ${moduleId}`),
          );
          checkForUpdate(true);
        }
      })
      .catch((error) => {
        if (['abort', 'fail'].includes(app.hot.status())) {
          console.warn(`${hmrPrefix}Cannot apply update.`);
          delete require.cache[path.resolve('./build/server')];
          // eslint-disable-next-line
          app = require(path.resolve('./build/server')).default;
          console.warn(`${hmrPrefix}App has been reloaded.`);
        } else {
          console.warn(
            `${hmrPrefix}Update failed: ${error.stack || error.message}`,
          );
        }
      });
  }

  serverCompiler.watch({}, (error, stats) => {
    if (app && !error && !stats.hasErrors()) {
      checkForUpdate().then(() => {
        appPromiseIsResolved = true;
        appPromiseResolve();
      });
    }
  });

  // Wait until both client-side and server-side bundles are ready
  await clientPromise;
  await serverPromise;

  const timeStart = new Date();
  console.info(`[${format(timeStart)}] Launching server...`);

  // Load compiled src/server/index.js as a middleware
  // eslint-disable-next-line
  app = require(path.resolve('./build/server')).default;
  appPromiseIsResolved = true;
  appPromiseResolve();

  // Launch the development server with Browsersync and HMR
  await new Promise((resolve, reject) => browserSync.create().init(
    {
      // https://www.browsersync.io/docs/options
      server: 'src/server/index.js',
      startPath: getConfig('baseUrl'),
      middleware: [server],
      open: !process.argv.includes('--silent'),
      ...(isDebug ? {} : { notify: false, ui: false }),
    },
    (error, bs) => (error ? reject(error) : resolve(bs)),
  ));

  const timeEnd = new Date();
  const time = timeEnd.getTime() - timeStart.getTime();
  console.info(`[${format(timeEnd)}] Server launched after ${time} ms`);
  return server;
}

export default start;
