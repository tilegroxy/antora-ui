'use strict'

const HOSTED_RX = /^https:\/\/(github\.com|gitlab\.com)\/[^/]+\/([^/]+?)\/?$/

// Header links from site.keys, falling back to the content source's GitHub/GitLab repository
module.exports = ({ data: { root } }) => {
  const keys = (root.site || {}).keys || {}
  const webUrl = ((root.page || {}).origin || {}).webUrl
  const match = !keys.repoUrl && webUrl && webUrl.match(HOSTED_RX)
  const repo = keys.repoUrl || (match ? webUrl : undefined)
  const sep = match && match[1].startsWith('gitlab') ? '/-/' : '/'
  return {
    repo,
    repoLabel: /gitlab/.test(repo) ? 'GitLab' : 'GitHub',
    issues: keys.issuesUrl || (match ? webUrl + sep + 'issues' : undefined),
    releases: keys.releasesUrl || (match ? webUrl + sep + 'releases' : undefined),
    product: keys.productName || (match ? match[2] : (root.site || {}).title),
  }
}
