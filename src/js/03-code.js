;(function () {
  'use strict'

  var PLACEHOLDER_RX = /\{[A-Za-z][\w.-]*\}/g
  var PLACEHOLDER_LANG_RX = /^(yaml|yml|json|console|shell|sh|bash|text)?$/
  var TERMINAL_LANGS = ['console', 'shell', 'bash', 'sh']

  // ---------- Copy chips (page header) ----------
  find('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      copyText(btn.getAttribute('data-copy'), btn)
    })
  })

  var doc = document.querySelector('article.doc')
  if (!doc) return

  // ---------- Code-only tabs become one dark card ----------
  find('.tabs', doc).forEach(function (tabs) {
    var panels = find('.tabpanel', tabs)
    if (!panels.length) return
    var codeOnly = panels.every(function (panel) {
      var kids = panel.children
      return kids.length === 1 && kids[0].classList.contains('listingblock')
    })
    if (!codeOnly) return
    tabs.classList.add('tabs-code')
    var tablist = tabs.querySelector('.tablist')
    if (!tablist) return
    // a block title (e.g. .tilegroxy.yml) becomes a filename label at the start of the tab bar
    var title = tabs.querySelector(':scope > .title')
    if (title) {
      var filename = document.createElement('span')
      filename.className = 'tabs-filename'
      filename.textContent = title.textContent
      tablist.insertBefore(filename, tablist.firstChild)
    }
    var btn = createCopyButton('copy-button tabs-copy')
    btn.addEventListener('click', function () {
      var visible = panels.filter(function (panel) { return !panel.classList.contains('is-hidden') })[0] || panels[0]
      var pre = visible.querySelector('pre')
      if (pre) copyText(codeText(pre), btn, 'Copy')
    })
    tablist.appendChild(btn)
  })

  // ---------- Code toolbox (language + copy) ----------
  find('.listingblock', doc).forEach(function (block) {
    if (block.closest('.tabs-code')) return
    var content = block.querySelector(':scope > .content')
    var pre = content && content.querySelector('pre')
    if (!pre) return
    var code = pre.querySelector('code[data-lang]')
    var lang = code ? code.getAttribute('data-lang') : ''
    var box = document.createElement('div')
    box.className = 'source-toolbox'
    var langEl = document.createElement('span')
    langEl.className = 'source-lang'
    langEl.textContent = ~TERMINAL_LANGS.indexOf(lang) ? 'Terminal' : lang
    var btn = createCopyButton('copy-button')
    btn.addEventListener('click', function () {
      copyText(codeText(pre), btn, 'Copy')
    })
    box.appendChild(langEl)
    box.appendChild(btn)
    content.insertBefore(box, pre)
    block.classList.add('has-toolbox')
  })

  // ---------- {placeholders} (after highlight.js has run) ----------
  window.addEventListener('load', function () {
    find('pre code', doc).forEach(function (code) {
      if (PLACEHOLDER_LANG_RX.test(code.getAttribute('data-lang') || '')) markPlaceholders(code)
    })
  })

  function markPlaceholders (root) {
    var walker = document.createTreeWalker(root, window.NodeFilter.SHOW_TEXT)
    var nodes = []
    while (walker.nextNode()) {
      PLACEHOLDER_RX.lastIndex = 0
      if (PLACEHOLDER_RX.test(walker.currentNode.nodeValue)) nodes.push(walker.currentNode)
    }
    nodes.forEach(function (node) {
      if (node.parentNode.classList && node.parentNode.classList.contains('placeholder')) return
      var frag = document.createDocumentFragment()
      var text = node.nodeValue
      var last = 0
      text.replace(PLACEHOLDER_RX, function (match, idx) {
        if (idx > last) frag.appendChild(document.createTextNode(text.slice(last, idx)))
        var span = document.createElement('span')
        span.className = 'placeholder'
        span.textContent = match
        frag.appendChild(span)
        last = idx + match.length
      })
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)))
      node.parentNode.replaceChild(frag, node)
    })
  }

  function createCopyButton (className) {
    var btn = document.createElement('button')
    btn.className = className
    btn.type = 'button'
    btn.textContent = 'Copy'
    return btn
  }

  // Copied text excludes callout markers and trailing whitespace
  function codeText (pre) {
    var clone = pre.cloneNode(true)
    find('.conum, .conum + b', clone).forEach(function (node) {
      node.parentNode.removeChild(node)
    })
    return clone.textContent.replace(/[ \t]+$/gm, '').replace(/\n+$/, '')
  }

  function copyText (text, btn, label) {
    if (!navigator.clipboard) return
    navigator.clipboard.writeText(text).then(function () {
      if (label) {
        btn.textContent = 'Copied'
        setTimeout(function () { btn.textContent = label }, 1400)
      } else {
        btn.classList.add('is-copied')
        setTimeout(function () { btn.classList.remove('is-copied') }, 1400)
      }
    }, function () {})
  }

  function find (selector, from) {
    return [].slice.call((from || document).querySelectorAll(selector))
  }
})()
