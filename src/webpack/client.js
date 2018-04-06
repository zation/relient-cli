import path from 'path';
import webpack from 'webpack';
import WebpackAssetsManifest from 'webpack-assets-manifest';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { writeFileSync } from 'fs';
import * as base from './base';
import getConfig from '../config';

const {
  context,
  isVerbose,
  isDebug,
  isAnalyze,
  resolve,
  styleRule,
  getJSRule,
  getStaticRules,
  excludeDevModulesRules,
  bail,
  cache,
  stats,
  devtool,
  publicPath,
  devtoolModuleFilenameTemplate,
  plugins,
} = base;
// eslint-disable-next-line
const pkg = require(path.resolve('./package.json'));

const defaultClientWebpack = {
  name: 'client',

  target: 'web',

  entry: {
    client: ['@babel/polyfill', path.resolve('./src/client/index.js')],
  },

  context,

  output: {
    path: path.resolve('./build/public/assets'),
    publicPath,
    pathinfo: isVerbose,
    filename: isDebug ? '[name].js' : '[name].[chunkhash:8].js',
    chunkFilename: isDebug ? '[name].chunk.js' : '[name].[chunkhash:8].chunk.js',
    devtoolModuleFilenameTemplate,
  },

  resolve,

  module: {
    // Make missing exports an error instead of warning
    strictExportPresence: true,
    rules: [
      getJSRule({
        targets: {
          browsers: pkg.browserslist,
          forceAllTransforms: !isDebug, // for UglifyJS
        },
      }),
      styleRule,
      ...getStaticRules(),
      ...excludeDevModulesRules,
    ],
  },

  bail,

  cache,

  stats,

  devtool,

  plugins: [
    ...plugins,

    // Define free variables
    // https://webpack.js.org/plugins/define-plugin/
    new webpack.DefinePlugin({
      __BROWSER__: true,
    }),

    // Emit a file with assets paths
    // https://github.com/webdeveric/webpack-assets-manifest#options
    new WebpackAssetsManifest({
      output: path.resolve('./build/asset-manifest.json'),
      publicPath: true,
      writeToDisk: true,
      customize: ({ key, value }) => {
        // You can prevent adding items to the manifest by returning false.
        if (key.toLowerCase().endsWith('.map')) return false;
        return { key, value };
      },
      done: (manifest, { compilation }) => {
        // Write chunk-manifest.json.json
        const chunkFileName = path.resolve('./build/chunk-manifest.json');
        try {
          const fileFilter = file => !file.endsWith('.map');
          const addPath = file => manifest.getPublicPath(file);
          const chunkFiles = compilation.chunkGroups.reduce((acc, c) => {
            acc[c.name] = [
              ...(acc[c.name] || []),
              ...c.chunks.reduce(
                (files, cc) => [
                  ...files,
                  ...cc.files.filter(fileFilter).map(addPath),
                ],
                [],
              ),
            ];
            return acc;
          }, Object.create(null));
          writeFileSync(chunkFileName, JSON.stringify(chunkFiles, null, 2));
        } catch (err) {
          console.error(`ERROR: Cannot write ${chunkFileName}: `, err);
          if (!isDebug) process.exit(1);
        }
      },
    }),

    // Webpack Bundle Analyzer
    // https://github.com/th0r/webpack-bundle-analyzer
    ...(isAnalyze ? [new BundleAnalyzerPlugin()] : []),
  ],

  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  // https://webpack.js.org/configuration/node/
  // https://github.com/webpack/node-libs-browser/tree/master/mock
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
  },

  // Move modules that occur in multiple entry chunks to a new entry chunk (the commons chunk).
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          chunks: 'initial',
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
        },
      },
    },
  },
};

export default getConfig('clientWebpack')({
  config: defaultClientWebpack,
  ...base,
  webpack,
  WebpackAssetsManifest,
  BundleAnalyzerPlugin,
});
