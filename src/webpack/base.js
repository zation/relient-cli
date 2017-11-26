import path from 'path';
import webpack from 'webpack';

export const isDebug = !process.argv.includes('--release');
export const isVerbose = process.argv.includes('--verbose');
export const isAnalyze = process.argv.includes('--analyze') || process.argv.includes('--analyse');

export const reScript = /\.(js|jsx|mjs)$/;
export const reStyle = /\.(css|less|styl|scss|sass|sss)$/;
export const reImage = /\.(bmp|gif|jpg|jpeg|png|svg)$/;

// CSS Nano options http://cssnano.co/
const minimizeCssOptions = {
  discardComments: { removeAll: true },
};

const kb = 1024;

export const publicPath = '/assets/';

// Point sourcemap entries to original disk location (format as URL on Windows)
export const devtoolModuleFilenameTemplate = info => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/');

export const context = path.resolve('.');

export const resolve = {
  // Allow absolute paths in imports, e.g. import Button from 'components/Button'
  // Keep in sync with .flowconfig and .eslintrc
  modules: ['node_modules', 'src'],
};

export const getJSRule = ({ targets }) => ({
  test: reScript,
  include: [
    path.resolve('./src'),
    path.resolve(__dirname, '../tools'),
  ],
  loader: 'babel-loader',
  options: {
    // https://github.com/babel/babel-loader#options
    cacheDirectory: isDebug,

    // https://babeljs.io/docs/usage/options/
    babelrc: false,
    presets: [
      // A Babel preset that can automatically determine the Babel plugins and polyfills
      // https://github.com/babel/babel-preset-env
      [
        '@babel/preset-env',
        {
          targets,
          modules: false,
          useBuiltIns: false,
          debug: false,
        },
      ],
      // Experimental ECMAScript proposals
      // https://babeljs.io/docs/plugins/#presets-stage-x-experimental-presets-
      '@babel/preset-stage-2',
      // Flow
      // https://github.com/babel/babel/tree/master/packages/babel-preset-flow
      '@babel/preset-flow',
      // JSX
      // https://github.com/babel/babel/tree/master/packages/babel-preset-react
      ['@babel/preset-react', { development: isDebug }],
    ],
    plugins: [
      // Treat React JSX elements as value types and hoist them to the highest scope
      // https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-react-constant-elements
      ...(isDebug ? [] : ['@babel/transform-react-constant-elements']),
      // Replaces the React.createElement function with one
      // that is more optimized for production
      // https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-react-inline-elements
      ...(isDebug ? [] : ['@babel/transform-react-inline-elements']),
      // Remove unnecessary React propTypes from the production build
      // https://github.com/oliviertassinari/babel-plugin-transform-react-remove-prop-types
      ...(isDebug ? [] : ['transform-react-remove-prop-types']),
      ['import', { libraryName: 'antd', style: false }],
      ['lodash', { id: ['lodash', 'recompose'] }],
    ],
  },
});

export const styleRule = {
  test: reStyle,
  rules: [
    // Convert CSS into JS module
    {
      issuer: { not: [reStyle] },
      use: 'isomorphic-style-loader',
    },

    // Process external/third-party styles
    {
      exclude: path.resolve('./src'),
      loader: 'css-loader',
      options: {
        sourceMap: isDebug,
        minimize: isDebug ? false : minimizeCssOptions,
      },
    },

    // Process internal/project styles without css module (from src folder)
    {
      test: /_\./,
      include: path.resolve('./src'),
      loader: 'css-loader',
      options: {
        sourceMap: isDebug,
        minimize: isDebug ? false : minimizeCssOptions,
      },
    },

    // Process internal/project styles with css module (from src folder)
    {
      test: /[^_]\./,
      include: path.resolve('./src'),
      loader: 'css-loader',
      options: {
        // CSS Loader https://github.com/webpack/css-loader
        importLoaders: 1,
        sourceMap: isDebug,
        // CSS Modules https://github.com/css-modules/css-modules
        modules: true,
        localIdentName: isDebug
          ? '[name]-[local]-[hash:base64:5]'
          : '[hash:base64:5]',
        // CSS Nano http://cssnano.co/
        minimize: isDebug ? false : minimizeCssOptions,
      },
    },

    // Apply PostCSS plugins including autoprefixer
    {
      loader: 'postcss-loader',
      options: {
        config: {
          path: path.resolve(__dirname, './postcss.config.js'),
        },
      },
    },

    // Compile Less to CSS
    // https://github.com/webpack-contrib/less-loader
    // Install dependencies before uncommenting: yarn add --dev less-loader less
    {
      test: /\.less$/,
      loader: 'less-loader',
    },

    // Compile Sass to CSS
    // https://github.com/webpack-contrib/sass-loader
    // Install dependencies before uncommenting: yarn add --dev sass-loader node-sass
    {
      test: /\.(scss|sass)$/,
      loader: 'sass-loader',
    },
  ],
};

const staticFileName = isDebug ? '[path][name].[ext]?[hash:8]' : '[hash:8].[ext]';
export const getStaticRules = ({
  emitFile,
} = {}) => ([
  {
    test: reImage,
    oneOf: [
      // Inline lightweight images into CSS
      {
        issuer: reStyle,
        oneOf: [
          // Inline lightweight SVGs as UTF-8 encoded DataUrl string
          {
            test: /\.svg$/,
            loader: 'svg-url-loader',
            options: {
              name: staticFileName,
              limit: 4 * kb,
              emitFile,
            },
          },

          // Inline lightweight images as Base64 encoded DataUrl string
          {
            loader: 'url-loader',
            options: {
              name: staticFileName,
              limit: 4 * kb,
              emitFile,
            },
          },
        ],
      },

      // Or return public URL to image resource
      {
        loader: 'file-loader',
        options: {
          name: staticFileName,
          emitFile,
        },
      },
    ],
  },
  // Return public URL for all assets unless explicitly excluded
  // DO NOT FORGET to update `exclude` list when you adding a new loader
  {
    exclude: [reScript, reStyle, reImage],
    loader: 'file-loader',
    options: {
      name: staticFileName,
      emitFile,
    },
  },
]);

export const excludeDevModulesRules = isDebug
  ? []
  : [
    {
      test: path.resolve('./node_modules/react-deep-force-update/lib/index.js'),
      loader: 'null-loader',
    },
  ];

// Don't attempt to continue if there are any errors.
export const bail = !isDebug;

export const cache = isDebug;

// Specify what bundle information gets displayed
// https://webpack.js.org/configuration/stats/
export const stats = {
  cached: isVerbose,
  cachedAssets: isVerbose,
  chunks: isVerbose,
  chunkModules: isVerbose,
  colors: true,
  hash: isVerbose,
  modules: isVerbose,
  reasons: isDebug,
  timings: true,
  version: isVerbose,
};

// Choose a developer tool to enhance debugging
// https://webpack.js.org/configuration/devtool/#devtool
export const devtool = isDebug ? 'cheap-module-inline-source-map' : 'source-map';

export const plugins = [
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': isDebug ? '"development"' : '"production"',
    __DEV__: isDebug,
  }),
];
