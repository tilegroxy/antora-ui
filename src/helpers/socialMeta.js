'use strict'

const TAG_ALL_RX = /<[^>]+>/g
const ABSOLUTE_RX = /^[a-z][a-z0-9+.-]*:\/\//i

// Open Graph / Twitter card values for the current page.
// Image comes from the page-og-image attribute, falling back to site.keys.ogImage.
module.exports = ({ data: { root } }) => {
  const site = root.site || {}
  const page = root.page || {}
  const keys = site.keys || {}
  const attrs = page.attributes || {}
  const siteUrl = (site.url || '').replace(/\/$/, '')
  const absolutize = (url) => {
    if (!url || ABSOLUTE_RX.test(url)) return url
    if (!siteUrl) return undefined
    return siteUrl + (url.charAt() === '/' ? '' : '/') + url
  }
  const detag = (html) => html && String(html).replace(TAG_ALL_RX, '').trim()
  const isHome = page.url && page.url === site.homeUrl
  const image = absolutize(attrs['og-image'] || keys.ogImage)
  return {
    siteName: site.title,
    type: isHome ? 'website' : 'article',
    title: detag(page.title) || site.title,
    description: detag(page.description || keys.description),
    url: page.canonicalUrl || absolutize(page.url),
    image,
    imageAlt: attrs['og-image-alt'] || keys.ogImageAlt,
    card: image ? 'summary_large_image' : 'summary',
    twitterSite: keys.twitterSite,
  }
}
