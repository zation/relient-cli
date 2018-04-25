import path from 'path';
import nodeExternals from 'webpack-node-externals';
import webpack from 'webpack';
import * as base from './base';
import getConfig, { serverConfig } from '../config';

const {
  context,
  resolve,
  styleRule,
  getJSRule,
  getStaticRules,
  excludeDevModulesRules,
  bail,
  stats,
  devtool,
  publicPath,
  devtoolModuleFilenameTemplate,
  reStyle,
  reImage,
  plugins,
  isDev,
} = base;
// eslint-disable-next-line
const pkg = require(path.resolve('./package.json'));

const defaultServerWebpack = {
  name: 'server',

  target: 'node',

  mode: isDev ? 'development' : 'none',

  entry: {
    server: ['@babel/polyfill', path.resolve('./src/server/index.js')],
  },

  context,

  output: {
    path: path.resolve('./build'),
    publicPath,
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

  stats,

  devtool,

  externals: [
    './chunk-manifest.json',
    './asset-manifest.json',
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

    ...(isDev ? [] : [
      new webpack.NamedModulesPlugin(),
      new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify('production') }),
      new webpack.optimize.ModuleConcatenationPlugin(),
      new webpack.NoEmitOnErrorsPlugin(),
    ]),
  ],

  // Do not replace node globals with polyfills
  // https://webpack.js.org/configuration/node/
  node: {
    console: false,
    global: false,
    process: false,
    Buffer: false,
    __dirname: false,
    __filename: true,
  },
};

export default getConfig('serverWebpack')({
  config: defaultServerWebpack,
  ...base,
  webpack,
  nodeExternals,
});
