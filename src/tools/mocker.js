import requireDir from 'require-dir';
import path from 'path';
import express, { Router } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import { forEach, flow } from 'lodash/fp';

import getConfig from '../config';

async function mocker() {
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
  )(path.resolve('./mocker'));
  app.use(router);

  app.listen(getConfig('mockerPort'), () => {
    // eslint-disable-next-line
    console.log(`Mock server is running on port ${getConfig('mockerPort')}`);
  });
}

export default mocker;
