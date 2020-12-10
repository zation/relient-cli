# Relient-CLI

Relient CLI is a cli wrapper of [react-starter-kit](https://github.com/kriasoft/react-starter-kit).
It also provides API mock.

## Install

```bash
$ npm install relient-cli --save-dev
```

## Basic usage

Make sure you have below project structure:

* **mocker/** API mock config
* **public/** static public files, for example: `robots.txt`, `favicon.ico`
* **src/**
  * **client/** client side code
    * index.js client side entry file
  * **server/** server side code
    * index.js server side entry file
  * **shared/** code shared with client and server

And add below scripts into `package.json`:

```json
"scripts": {
	"clean": "relient clean",
	"copy": "relient copy",
	"bundle": "relient bundle",
	"build": "relient build",
	"build-stats": "relient build --analyse",
	"serve": "relient runServer",
	"start": "relient start",
	"mocker": "relient mocker"
}
```

Then `npm run start` will give you a working isomorphic web application in dev environment.

## Scripts

### relient clean

Clear `build` folder.

### relient copy

Copy all files from `public` folder and `yarn.lock` to `build`. If you run with `--watch`, files will be copy when changed automatically.

### relient bundle

Create application bundles (both client and server side) with webpack compilation.

### relient build

Run clean, copy, bundle in sequence. When you want to release your app to prod, please run this script.

### relient build --analyse

This will show a build stats with `BundleAnalyzerPlugin`

### relient start

Start the application in dev enironment.

### relient mocker

Run mock server.

## Config

Add `relient.config.js` in the root of your project to config relient. The default config will be:

```js
{
  mockerPort: 9001,
  clientConfigs: [],
  babelPlugins: [],
  proxy: {
    from: ['/api'],
    target: 'http://localhost:9001',
    changeOrigin: true,
  },
  baseUrl: '/admin', // This will be used to webpack public path and browserSync startPath
}
```

You can add your custom config in `relient.config.js` to overwrite the default value or add a new config value.

## Mock

The mock is built based on express. For example, we can create a mocker for account:

mocker/account.js

```
export default (router) => {
  router.post('/account', ({ body }, response) => {
    response.status(200).send(body);
  });

  router.get('/account/all', (request, response) => {
    response.status(200).send([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);
  });
}
```
