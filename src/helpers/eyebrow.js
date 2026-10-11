'use strict'

// The :page-eyebrow: attribute, else the title of the parent nav entry
module.exports = ({ data: { root } }) => {
  const page = root.page || {}
  const explicit = (page.attributes || {}).eyebrow
  if (explicit) return explicit === 'none' ? undefined : explicit
  const crumbs = page.breadcrumbs || []
  const parent = crumbs.length > 1 && crumbs[crumbs.length - 2]
  return parent ? parent.content.replace(/<[^>]+>/g, '') : undefined
}
