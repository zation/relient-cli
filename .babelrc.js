// Babel configuration
// https://babeljs.io/docs/usage/api/

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
    // The features required by mocker may contain react icon code
    '@babel/preset-react',
  ],
};
