'use strict'

// JSON map of page URL -> nav trail (list title and parent entries, as in the breadcrumbs)
// for every component version, so search results can show where a page sits.
// The component itself is left out; results are already grouped under it.
module.exports = ({ data: { root } }) => {
  const trails = {}
  const visit = (items, trail) =>
    (items || []).forEach((item) => {
      const label = (item.content || '').replace(/<[^>]+>/g, '').trim()
      if (item.url && item.urlType === 'internal') {
        const url = item.url.split('#')[0]
        if (!(url in trails)) trails[url] = trail
      }
      visit(item.items, label ? trail.concat(label) : trail)
    })
  Object.values((root.site || {}).components || {}).forEach((component) =>
    (component.versions || []).forEach((version) => visit(version.navigation, []))
  )
  return JSON.stringify(trails).replace(/</g, '\\u003c')
}
