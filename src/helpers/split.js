'use strict'

// Splits a comma-separated page attribute (e.g. :page-tags: raster, vector) into a list
module.exports = (str) => (typeof str === 'string' ? str.split(',').map((s) => s.trim()).filter(Boolean) : [])
