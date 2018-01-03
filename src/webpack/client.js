import path from 'path';
import webpack from 'webpack';
import AssetsPlugin from 'assets-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
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
    // https://github.com/sporto/assets-webpack-plugin#options
    new AssetsPlugin({
      path: path.resolve('./build'),
      filename: 'assets.json',
      prettyPrint: true,
    }),

    // Move modules that occur in multiple entry chunks to a new entry chunk (the commons chunk).
    // https://webpack.js.org/plugins/commons-chunk-plugin/
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: module => /node_modules/.test(module.resource),
    }),

    ...(isDebug
      ? []
      : [
        // Decrease script evaluation time
        // https://github.com/webpack/webpack/blob/master/examples/scope-hoisting/README.md
        new webpack.optimize.ModuleConcatenationPlugin(),

        // Minimize all JavaScript output of chunks
        // https://github.com/mishoo/UglifyJS2#compressor-options
        new webpack.optimize.UglifyJsPlugin({
          compress: {
            warnings: isVerbose,
            unused: true,
            dead_code: true,
            screw_ie8: true,
          },
          mangle: {
            screw_ie8: true,
          },
          output: {
            comments: false,
            screw_ie8: true,
          },
          sourceMap: true,
        }),
      ]),

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
};

export default getConfig('clientWebpack')({
  config: defaultClientWebpack,
  ...base,
  webpack,
  AssetsPlugin,
  BundleAnalyzerPlugin,
});
