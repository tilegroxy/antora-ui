;(function () {
  'use strict'

  var hljs = require('highlight.js/lib/core')
  hljs.registerLanguage('asciidoc', require('highlight.js/lib/languages/asciidoc'))
  hljs.registerLanguage('bash', require('highlight.js/lib/languages/bash'))
  hljs.registerLanguage('clojure', require('highlight.js/lib/languages/clojure'))
  hljs.registerLanguage('cpp', require('highlight.js/lib/languages/cpp'))
  hljs.registerLanguage('csharp', require('highlight.js/lib/languages/csharp'))
  hljs.registerLanguage('css', require('highlight.js/lib/languages/css'))
  hljs.registerLanguage('diff', require('highlight.js/lib/languages/diff'))
  hljs.registerLanguage('dockerfile', require('highlight.js/lib/languages/dockerfile'))
  hljs.registerLanguage('elixir', require('highlight.js/lib/languages/elixir'))
  hljs.registerLanguage('go', require('highlight.js/lib/languages/go'))
  hljs.registerLanguage('groovy', require('highlight.js/lib/languages/groovy'))
  hljs.registerLanguage('haskell', require('highlight.js/lib/languages/haskell'))
  hljs.registerLanguage('java', require('highlight.js/lib/languages/java'))
  hljs.registerLanguage('javascript', require('highlight.js/lib/languages/javascript'))
  hljs.registerLanguage('json', require('highlight.js/lib/languages/json'))
  hljs.registerLanguage('julia', require('highlight.js/lib/languages/julia'))
  hljs.registerLanguage('kotlin', require('highlight.js/lib/languages/kotlin'))
  hljs.registerLanguage('lua', require('highlight.js/lib/languages/lua'))
  hljs.registerLanguage('markdown', require('highlight.js/lib/languages/markdown'))
  hljs.registerLanguage('nix', require('highlight.js/lib/languages/nix'))
  hljs.registerLanguage('none', require('highlight.js/lib/languages/plaintext'))
  hljs.registerLanguage('objectivec', require('highlight.js/lib/languages/objectivec'))
  hljs.registerLanguage('perl', require('highlight.js/lib/languages/perl'))
  hljs.registerLanguage('php', require('highlight.js/lib/languages/php'))
  hljs.registerLanguage('properties', require('highlight.js/lib/languages/properties'))
  hljs.registerLanguage('puppet', require('highlight.js/lib/languages/puppet'))
  hljs.registerLanguage('python', require('highlight.js/lib/languages/python'))
  hljs.registerLanguage('ruby', require('highlight.js/lib/languages/ruby'))
  hljs.registerLanguage('rust', require('highlight.js/lib/languages/rust'))
  hljs.registerLanguage('scala', require('highlight.js/lib/languages/scala'))
  hljs.registerLanguage('shell', require('highlight.js/lib/languages/shell'))
  hljs.registerLanguage('sql', require('highlight.js/lib/languages/sql'))
  hljs.registerLanguage('swift', require('highlight.js/lib/languages/swift'))
  hljs.registerLanguage('xml', require('highlight.js/lib/languages/xml'))
  hljs.registerLanguage('yaml', require('highlight.js/lib/languages/yaml'))
  // the markup in code blocks (e.g., callouts) is trusted since it comes from the AsciiDoc converter
  hljs.configure({ ignoreUnescapedHTML: true })
  hljs.addPlugin(mergeHTMLPlugin())
  ;[].slice.call(document.querySelectorAll('pre code.hljs[data-lang]')).forEach(function (node) {
    hljs.highlightElement(node)
  })

  // Restores the original markup of a code block after it's highlighted, which highlight.js 11 no longer does.
  // Adapted from the merge logic in highlight.js 10 (see https://github.com/highlightjs/highlight.js/issues/2889).
  function mergeHTMLPlugin () {
    var originalStream
    return {
      'before:highlightElement': function (data) {
        originalStream = nodeStream(data.el)
      },
      'after:highlightElement': function (data) {
        if (!originalStream.length) return
        var resultNode = document.createElement('div')
        resultNode.innerHTML = data.result.value
        data.result.value = mergeStreams(originalStream, nodeStream(resultNode), data.text)
        data.el.innerHTML = data.result.value
      },
    }
  }

  function nodeStream (node) {
    var result = []
    ;(function walk (node, offset) {
      for (var child = node.firstChild; child; child = child.nextSibling) {
        if (child.nodeType === 3) {
          offset += child.nodeValue.length
        } else if (child.nodeType === 1) {
          result.push({ event: 'start', offset: offset, node: child })
          offset = walk(child, offset)
          if (!/br|hr|img|input/.test(tagName(child))) result.push({ event: 'stop', offset: offset, node: child })
        }
      }
      return offset
    })(node, 0)
    return result
  }

  function mergeStreams (original, highlighted, value) {
    var processed = 0
    var result = ''
    var nodeStack = []
    var stream
    while (original.length || highlighted.length) {
      stream = selectStream()
      result += escapeHTML(value.slice(processed, stream[0].offset))
      processed = stream[0].offset
      if (stream === original) {
        // close the highlighted stack, render the original tags at this offset, then reopen the highlighted stack
        nodeStack.reverse().forEach(close)
        do {
          render(stream.splice(0, 1)[0])
          stream = selectStream()
        } while (stream === original && stream.length && stream[0].offset === processed)
        nodeStack.reverse().forEach(open)
      } else {
        if (stream[0].event === 'start') {
          nodeStack.push(stream[0].node)
        } else {
          nodeStack.pop()
        }
        render(stream.splice(0, 1)[0])
      }
    }
    return result + escapeHTML(value.slice(processed))

    function selectStream () {
      if (!original.length || !highlighted.length) return original.length ? original : highlighted
      if (original[0].offset !== highlighted[0].offset) {
        return original[0].offset < highlighted[0].offset ? original : highlighted
      }
      // ensure original always starts first and closes last
      return highlighted[0].event === 'start' ? original : highlighted
    }

    function open (node) {
      result += '<' + tagName(node) + [].map.call(node.attributes, function (attr) {
        return ' ' + attr.nodeName + '="' + escapeHTML(attr.value) + '"'
      }).join('') + '>'
    }

    function close (node) {
      result += '</' + tagName(node) + '>'
    }

    function render (event) {
      (event.event === 'start' ? open : close)(event.node)
    }
  }

  function escapeHTML (value) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
  }

  function tagName (node) {
    return node.nodeName.toLowerCase()
  }
})()
