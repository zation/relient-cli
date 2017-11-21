import { flow, pick, keys, omit, prop, propertyOf } from 'lodash/fp';

let customConfig = {};
try {
  // eslint-disable-next-line
  customConfig = require(path.resolve('./.relientrc.js'));
  // eslint-disable-next-line
} catch (error) {
}

const defaultConfig = {
  apiDomain: 'http://localhost:9001/api',
  port: 3000,
  clientConfigs: ['apiDomain'],
  webpack: {
    clientExtraPlugins: [],
    serverExtraPlugins: [],
  },
};

const config = {
  ...defaultConfig,
  ...omit('webpack')(customConfig),
  webpack: {
    ...defaultConfig.webpack,
    ...prop('webpack')(customConfig),
  },
};

const finalConfig = {
  ...config,
  ...flow(pick(keys(config)))(process.env),
};

export const getConfig = propertyOf(finalConfig);

export const serverConfig = omit(['webpack', 'clientConfigs'])(finalConfig);
