import {
  propertyOf,
  identity,
  isFunction,
  isNumber,
  isObject,
  forEach,
  isArray,
  isString,
  prop,
} from 'lodash/fp';
import path from 'path';
import { existsSync } from 'fs';

const defaultConfig = {
  clientWebpack: prop('config'),
  serverWebpack: prop('config'),
  postcss: identity,
  mockerPort: 9001,
  exportRoutes: ['/'],
  babelPlugins: [],
  babelPresets: [],
  proxy: {
    from: ['/api'],
    target: 'http://localhost:9001',
    changeOrigin: true,
  },
  baseUrl: '',
};

const configSchema = [
  ['clientWebpack', isFunction, 'function'],
  ['serverWebpack', isFunction, 'function'],
  ['postcss', isFunction, 'function'],
  ['mockerPort', isNumber, 'number'],
  ['babelPlugins', isArray, 'array'],
  ['babelPresets', isArray, 'array'],
  ['exportRoutes', isArray, 'array'],
  ['proxy', isObject, 'object'],
  ['baseUrl', isString, 'string'],
];

const customConfigPath = path.resolve('./relient.config.js');
// eslint-disable-next-line import/no-dynamic-require
const customConfig = existsSync(customConfigPath) ? require(customConfigPath).default : {};

forEach(([key, validate, type]) => {
  if (customConfig[key] && !validate(customConfig[key])) {
    throw new Error(`relient.config.js ${key} should be ${type}.`);
  }
})(configSchema);

export default propertyOf({
  ...defaultConfig,
  ...customConfig,
});
