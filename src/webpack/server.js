import path from 'path';
import nodeExternals from 'webpack-node-externals';
import webpack from 'webpack';
import {
  context,
  isVerbose,
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
  reStyle,
  reImage,
  plugins,
} from './base';
import getConfig, { serverConfig } from '../config';

// eslint-disable-next-line
const pkg = require(path.resolve('./package.json'));

const defaultServerWebpack = {
  name: 'server',

  target: 'node',

  entry: {
    server: ['@babel/polyfill', path.resolve('./src/server/index.js')],
  },

  context,

  output: {
    path: path.resolve('./build'),
    publicPath,
    pathinfo: isVerbose,
    filename: '[name].js',
    chunkFilename: 'chunks/[name].js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate,
  },

  resolve,

  module: {
    // Make missing exports an error instead of warning
    strictExportPresence: true,
    rules: [
      getJSRule({
        targets: {
          node: pkg.engines.node.match(/(\d+\.?)+/)[0],
        },
      }),
      styleRule,
      ...getStaticRules({ emitFile: false }),
      ...excludeDevModulesRules,
    ],
  },

  bail,

  cache,

  stats,

  devtool,

  externals: [
    './assets.json',
    nodeExternals({
      whitelist: [reStyle, reImage, /relient\/config(\/index)?$/],
    }),
  ],

  plugins: [
    ...plugins,

    // Define free variables
    // https://webpack.js.org/plugins/define-plugin/
    new webpack.DefinePlugin({
      __BROWSER__: false,
      __RELIENT_CONFIG__: JSON.stringify(serverConfig),
    }),

    // Adds a banner to the top of each generated chunk
    // https://webpack.js.org/plugins/banner-plugin/
    new webpack.BannerPlugin({
      banner: 'require("source-map-support").install();',
      raw: true,
      entryOnly: false,
    }),
  ],

  // Do not replace node globals with polyfills
  // https://webpack.js.org/configuration/node/
  node: {
    console: false,
    global: false,
    process: false,
    Buffer: false,
    __dirname: false,
  },
};

export default getConfig('serverWebpack')(defaultServerWebpack);
