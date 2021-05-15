import path from 'path';
import webpack from 'webpack';
import { getWithBaseUrl } from 'relient/url';
import getConfig from '../config';

export const isDev = process.env.NODE_ENV !== 'production';
export const isAnalyze = process.argv.includes('--analyze') || process.argv.includes('--analyse');

export const reScript = /\.(ts|tsx|js|jsx|mjs)$/;
export const reStyle = /\.(css|less|styl|scss|sass|sss)$/;
export const reStyleWithModule = /[^_]\.(css|less|styl|scss|sass|sss)$/;
export const reStyleWithoutModule = /_\.(css|less|styl|scss|sass|sss)$/;
export const reImage = /\.(bmp|gif|jpg|jpeg|png|svg)$/;

const kb = 1024;

export const publicPath = getWithBaseUrl('/assets/', getConfig('baseUrl'));

// Point sourcemap entries to original disk location (format as URL on Windows)
export const devtoolModuleFilenameTemplate = (info) => path.resolve(info.absoluteResourcePath)
  .replace(/\\/g, '/');

export const context = path.resolve('.');

export const resolve = {
  // Allow absolute paths in imports, e.g. import Button from 'components/Button'
  // Keep in sync with .flowconfig and .eslintrc
  modules: ['node_modules', 'src'],
  extensions: ['.ts', '.tsx', '.js', '.json'],
};

export const resolveLoader = {
  extensions: ['.ts', '.js', '.json'],
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
    cacheDirectory: isDev,

    // https://babeljs.io/docs/usage/options/
    babelrc: false,
    configFile: false,
    presets: [
      // A Babel preset that can automatically determine the Babel plugins and polyfills
      // https://github.com/babel/babel-preset-env
      [
        '@babel/preset-env',
        {
          targets,
          forceAllTransforms: !isDev, // for UglifyJS
          modules: false,
          useBuiltIns: false,
          debug: false,
        },
      ],
      // JSX
      // https://github.com/babel/babel/tree/master/packages/babel-preset-react
      ['@babel/preset-react', { development: isDev }],

      '@babel/preset-typescript',

      ...getConfig('babelPresets'),
    ],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      '@babel/plugin-proposal-function-sent',
      '@babel/plugin-proposal-export-namespace-from',
      '@babel/plugin-proposal-numeric-separator',
      '@babel/plugin-proposal-throw-expressions',
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-proposal-class-properties',
      ...(isDev ? [] : [
        // Treat React JSX elements as value types and hoist them to the highest scope
        // https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-react-constant-elements
        '@babel/transform-react-constant-elements',
        // Replaces the React.createElement function with one
        // that is more optimized for production
        // https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-react-inline-elements
        '@babel/transform-react-inline-elements',
        // Remove unnecessary React propTypes from the production build
        // https://github.com/oliviertassinari/babel-plugin-transform-react-remove-prop-types
        'transform-react-remove-prop-types',
      ]),
      ...getConfig('babelPlugins'),
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
        sourceMap: isDev,
      },
    },

    // Process internal/project styles without css module (from src folder)
    {
      test: reStyleWithoutModule,
      include: path.resolve('./src'),
      loader: 'css-loader',
      options: {
        sourceMap: isDev,
      },
    },

    // Process internal/project styles with css module (from src folder)
    {
      test: reStyleWithModule,
      include: path.resolve('./src'),
      loader: 'css-loader',
      options: {
        // CSS Loader https://github.com/webpack/css-loader
        importLoaders: 1,
        sourceMap: isDev,
        // CSS Modules https://github.com/css-modules/css-modules
        modules: {
          localIdentName: isDev
            ? '[name]-[local]-[fullhash:base64:5]'
            : '[fullhash:base64:5]',
        },
      },
    },

    // Apply PostCSS plugins including autoprefixer
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          config: path.resolve(__dirname, './postcss.config.js'),
        },
      },
    },

    // Compile Less to CSS
    // https://github.com/webpack-contrib/less-loader
    // Install dependencies before uncommenting: yarn add --dev less-loader less
    {
      test: /\.less$/,
      loader: 'less-loader',
      options: {
        lessOptions: {
          javascriptEnabled: true,
        },
      },
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

const staticFileName = isDev ? '[path][name].[ext]?[fullhash:8]' : '[fullhash:8].[ext]';
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

export const excludeDevModulesRules = isDev
  ? []
  : [
    {
      test: path.resolve('./node_modules/react-deep-force-update/lib/index.js'),
      loader: 'null-loader',
    },
  ];

// Don't attempt to continue if there are any errors.
export const bail = !isDev;

export const stats = {
  colors: true,
};

// Choose a developer tool to enhance debugging
// https://webpack.js.org/configuration/devtool/#devtool
export const devtool = isDev ? 'inline-cheap-module-source-map' : 'source-map';

export const plugins = [
  new webpack.DefinePlugin({
    __DEV__: isDev,
  }),
];
