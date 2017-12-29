import requireDir from 'require-dir';
import { resolve } from 'path';
import express, { Router } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import { forEach, flow } from 'lodash/fp';
import { createMonitor } from 'watch';

import getConfig from '../config';

const path = resolve('./mocker');

const startServer = () => {
  const app = express();
  app.use(morgan('dev'));
  app.use(cors());
  app.use(bodyParser.json());
  app.use((req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
  });

  const router = new Router();
  flow(
    requireDir,
    forEach((module) => {
      module.default(router);
    }),
  )(path);
  app.use(router);

  return app.listen(getConfig('mockerPort'), () => {
    // eslint-disable-next-line
    console.log(`Mock server is running on port ${getConfig('mockerPort')}`);
  });
};

async function mocker() {
  let server = startServer();

  createMonitor(path, (monitor) => {
    monitor.on('changed', (file) => {
      // eslint-disable-next-line no-underscore-dangle
      delete require.cache[file];
      // eslint-disable-next-line
      console.log('Detect mock folder changed, restarting mock server...');
      if (server && server.close) {
        server.close();
      }
      server = startServer();
    });
  });
}

export default mocker;
