'use strict'

// Header components, ordered by site.keys.manual_order (component names), else home component first
module.exports = ({ data: { root } }) => {
  const site = root.site || {}
  const components = Object.values(site.components || {})
  const order = String((site.keys || {}).manualOrder || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const rank = (c) => {
    const idx = order.indexOf(c.name)
    if (~idx) return idx
    return c.url === site.homeUrl ? -1 : order.length
  }
  return components
    .map((c, idx) => ({ c, idx, rank: rank(c) }))
    .sort((a, b) => a.rank - b.rank || a.idx - b.idx)
    .map(({ c }) => c)
}
