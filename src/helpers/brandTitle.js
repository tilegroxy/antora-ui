'use strict'

const SUFFIX_RX = /^(.+?)\s+(Docs|Documentation)$/i

// Splits a trailing "Docs" off the site title so the header can drop it on narrow screens
module.exports = (title) => {
  const match = typeof title === 'string' && title.match(SUFFIX_RX)
  return match ? { name: match[1], suffix: match[2] } : { name: title }
}
