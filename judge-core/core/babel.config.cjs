'use strict';

module.exports = {
  sourceMaps: 'both',
  plugins: [
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-transform-async-to-generator',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-transform-runtime',
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          browsers: ['last 3 versions'],
          node: 'current',
        },
      },
    ],
    '@babel/preset-typescript',
  ],
};
