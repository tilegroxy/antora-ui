'use strict'

const neostandard = require('neostandard')

module.exports = [
  // third-party script copied verbatim from @asciidoctor/tabs
  { ignores: ['src/js/vendor/tabs.js'] },
  ...neostandard({ env: ['browser'], noJsx: true }),
  {
    rules: {
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
        },
      ],
      'no-restricted-properties': ['error', { property: 'substr', message: 'Use String#slice instead.' }],
      '@stylistic/max-len': [1, 120, 2],
      '@stylistic/spaced-comment': 'off',
      radix: ['error', 'always'],
    },
  },
  {
    // browser scripts are written in ES5
    files: ['src/js/**/*.js'],
    rules: {
      'no-var': 'off',
      'object-shorthand': 'off',
    },
  },
]
