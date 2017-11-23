import { flow, pick, keys, omit, propertyOf, camelCase, identity } from 'lodash/fp';

let customConfig = {};
try {
  // eslint-disable-next-line
  customConfig = require(path.resolve('./relient.config.js'));
  // eslint-disable-next-line
} catch (error) {
}

const defaultConfig = {
  apiDomain: 'http://localhost:9001/api',
  port: 3000,
  clientConfigs: ['apiDomain'],
  clientWebpack: identity,
  serverWebpack: identity,
  postcss: identity,
};

const config = {
  ...defaultConfig,
  ...customConfig,
  ...flow(camelCase, pick(keys(defaultConfig)))(process.env),
};

export const getConfig = propertyOf(config);

export const serverConfig = omit(['clientConfigs', 'clientWebpack', 'serverWebpack', 'postcss'])(config);
