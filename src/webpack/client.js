import path from 'path';
import webpack from 'webpack';
import AssetsPlugin from 'assets-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import * as base from './base';
import getConfig from '../config';

const {
  context,
  isDebug,
  isAnalyze,
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
  plugins,
  mode,
} = base;
// eslint-disable-next-line
const pkg = require(path.resolve('./package.json'));

const defaultClientWebpack = {
  name: 'client',

  target: 'web',

  mode,

  entry: {
    client: ['@babel/polyfill', path.resolve('./src/client/index.js')],
  },

  context,

  output: {
    path: path.resolve('./build/public/assets'),
    publicPath,
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
    // https://github.com/sporto/assets-webpack-plugin#options
    new AssetsPlugin({
      path: path.resolve('./build'),
      filename: 'assets.json',
      prettyPrint: true,
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
    __filename: true,
  },
};

export default getConfig('clientWebpack')({
  config: defaultClientWebpack,
  ...base,
  webpack,
  AssetsPlugin,
  BundleAnalyzerPlugin,
});
