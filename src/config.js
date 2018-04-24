import {
  propertyOf,
  identity,
  isFunction,
  isNumber,
  isString,
  isObject,
  forEach,
  isArray,
  omit,
  prop,
} from 'lodash/fp';
import path from 'path';
import { existsSync } from 'fs';

const defaultConfig = {
  clientWebpack: prop('config'),
  serverWebpack: prop('config'),
  postcss: identity,
  mockerPort: 9001,
  serverAPIDomain: 'http://localhost:9001',
  port: 3000,
  clientConfigs: [],
  babelPlugins: [],
  proxy: {
    from: ['/api'],
    target: 'http://localhost:9001',
    changeOrigin: true,
  },
};

const configSchema = [
  ['clientWebpack', isFunction, 'function'],
  ['serverWebpack', isFunction, 'function'],
  ['postcss', isFunction, 'function'],
  ['mockerPort', isNumber, 'number'],
  ['serverAPIDomain', isString, 'string'],
  ['port', isNumber, 'number'],
  ['clientConfigs', isArray, 'array'],
  ['babelPlugins', isArray, 'array'],
  ['proxy', isObject, 'object'],
];

const customConfigPath = path.resolve('./relient.config.js');
// eslint-disable-next-line import/no-dynamic-require
const customConfig = existsSync(customConfigPath) ? require(customConfigPath).default : {};

forEach(([key, validate, type]) => {
  if (customConfig[key] && !validate(customConfig[key])) {
    throw new Error(`relient.config.js ${key} should be ${type}.`);
  }
})(configSchema);

const config = {
  ...defaultConfig,
  ...customConfig,
};

export const serverConfig = omit([
  'clientWebpack',
  'serverWebpack',
  'postcss',
  'mockerPort',
])(config);

export default propertyOf(config);
