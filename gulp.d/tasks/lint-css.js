'use strict'

const log = require('fancy-log')
const PluginError = require('plugin-error')

module.exports = (files) => () =>
  import('stylelint').then(({ default: stylelint }) =>
    stylelint.lint({ files, formatter: 'string' }).then(({ errored, report }) => {
      if (report) log(report)
      if (errored) throw new PluginError('stylelint', 'Failed with errors')
    })
  )
