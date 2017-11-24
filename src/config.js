import { propertyOf, identity, isFunction, isNumber, forEach } from 'lodash/fp';

const defaultConfig = {
  clientWebpack: identity,
  serverWebpack: identity,
  postcss: identity,
  mockerPort: 9001,
};

const configSchema = [
  ['clientWebpack', isFunction, 'function'],
  ['serverWebpack', isFunction, 'function'],
  ['postcss', isFunction, 'function'],
  ['mockerPort', isNumber, 'number'],
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

export default propertyOf({
  ...defaultConfig,
  ...customConfig,
});
