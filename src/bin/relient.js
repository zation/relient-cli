#!/usr/bin/env node
require('@babel/polyfill');
require('@babel/register')({
  // This will override `node_modules` ignoring - you can alternatively pass
  // an array of strings to be explicitly matched or a regex / glob
  ignore: [(file) => {
    if (file.match(/relient-cli\/src/)) {
      return false;
    }
    return file.match(/node_modules/);
  }],
});
const run = require('../tools/run');

if (require.main === module && process.argv.length > 2) {
  // eslint-disable-next-line no-underscore-dangle
  delete require.cache[__filename];

  // eslint-disable-next-line global-require, import/no-dynamic-require
  const module = require(`../tools/${process.argv[2]}.js`).default;

  run(module).catch((err) => {
    console.error(err.stack);
    process.exit(1);
  });
}
