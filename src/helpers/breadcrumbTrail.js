'use strict'

const detag = (html) => String(html || '').replace(/<[^>]+>/g, '').trim()

// The breadcrumb items above the page title (component, then nav parents, not the page itself),
// ending with the eyebrow: the last crumb is marked as the eyebrow when they match,
// otherwise the eyebrow is added as a final, unlinked item
module.exports = (eyebrow, { data: { root } }) => {
  const page = root.page || {}
  const items = []
  const cv = page.componentVersion
  if (cv) items.push({ content: cv.title, url: cv.url })
  ;(page.breadcrumbs || []).slice(0, -1).forEach(({ content, url }) => items.push({ content, url }))
  if (eyebrow) {
    const last = items[items.length - 1]
    if (last && detag(last.content).toLowerCase() === String(eyebrow).trim().toLowerCase()) last.eyebrow = true
    else items.push({ text: eyebrow, eyebrow: true })
  }
  return items
}
