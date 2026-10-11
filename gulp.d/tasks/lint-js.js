'use strict'

const { ESLint } = require('eslint')
const log = require('fancy-log')
const PluginError = require('plugin-error')

module.exports = (files) => async () => {
  const eslint = new ESLint()
  const results = await eslint.lintFiles(files)
  const report = (await eslint.loadFormatter('stylish')).format(results)
  if (report) log(report)
  if (results.some(({ errorCount }) => errorCount)) throw new PluginError('eslint', 'Failed with errors')
}
