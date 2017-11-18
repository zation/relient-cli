import webpack from 'webpack';
import clientConfig from '../webpack/client';
import serverConfig from '../webpack/server';

/**
 * Creates application bundles from the source files.
 */
function bundle() {
  return new Promise((resolve, reject) => {
    webpack([clientConfig, serverConfig]).run((err, stats) => {
      if (err) {
        return reject(err);
      }

      console.info(stats.toString(clientConfig.stats));
      return resolve();
    });
  });
}

export default bundle;
