import {
  propertyOf,
  identity,
  isFunction,
  isNumber,
  isString,
  forEach,
  isArray,
  omit,
} from 'lodash/fp';

const defaultConfig = {
  clientWebpack: identity,
  serverWebpack: identity,
  postcss: identity,
  mockerPort: 9001,
  apiDomain: 'http://localhost:9001',
  port: 3000,
  clientConfigs: ['apiDomain'],
};

const configSchema = [
  ['clientWebpack', isFunction, 'function'],
  ['serverWebpack', isFunction, 'function'],
  ['postcss', isFunction, 'function'],
  ['mockerPort', isNumber, 'number'],
  ['apiDomain', isString, 'string'],
  ['port', isNumber, 'number'],
  ['clientConfigs', isArray, 'array'],
];

let customConfig = {};
try {
  // eslint-disable-next-line
  customConfig = require(path.resolve('./relient.config.js'));
  // eslint-disable-next-line
} catch (error) {
}

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
