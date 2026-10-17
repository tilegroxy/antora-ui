;(function () {
  'use strict'

  var doc = document.querySelector('article.doc')
  if (!doc) return

  var columns = []

  // ---------- Lay out a listing (or code tabs) and its callout list side by side ----------
  find('.colist', doc).forEach(function (colist) {
    var prev = colist.previousElementSibling
    if (!prev || !(prev.classList.contains('listingblock') || prev.classList.contains('tabs'))) return
    if (!colist.querySelector('tr')) return
    var wrap = document.createElement('div')
    wrap.className = 'annotated'
    prev.parentNode.insertBefore(wrap, prev)
    wrap.appendChild(prev)
    wrap.appendChild(colist)
    columns.push(prev, colist)
  })

  if (!columns.length) return

  // ---------- The shorter column rides along with the longer one ----------
  // A column taller than the viewport moves with the page until its bottom (scrolling down) or its top
  // (scrolling up) comes into view, then sticks there, so all of it can be read without reaching the end.
  var lastScrollY = window.pageYOffset
  var lastTops = []
  window.addEventListener('scroll', updateStickyTops, { passive: true })
  window.addEventListener('resize', updateStickyTops)
  updateStickyTops()

  function updateStickyTops () {
    var delta = window.pageYOffset - lastScrollY
    lastScrollY = window.pageYOffset
    columns.forEach(function (column, i) {
      if (window.getComputedStyle(column).position !== 'sticky') return
      var bounds = stickyBounds(column)
      var prev = i in lastTops ? lastTops[i] : column.getBoundingClientRect().top
      column.style.top = clamp(prev - delta, bounds[0], bounds[1]) + 'px'
      lastTops[i] = column.getBoundingClientRect().top
    })
  }

  // the range a column's sticky top can take: bottom against the viewport bottom up to top under the header
  function stickyBounds (column) {
    var max = (parseFloat(window.getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0) + 16
    return [Math.min(max, window.innerHeight - column.offsetHeight - 16), max]
  }

  function clamp (n, min, max) {
    return Math.min(Math.max(n, min), max)
  }

  // ---------- Clicking a number on either side highlights the line ----------
  document.addEventListener('click', function (e) {
    var wrap = e.target.closest && e.target.closest('.annotated')
    if (!wrap) return
    var conum = e.target.closest('pre .conum')
    if (conum) {
      var n = conum.getAttribute('data-value')
      activate(wrap, n)
      return reveal(wrap, find('.colist tr', wrap)[n - 1])
    }
    var tr = e.target.closest('.colist tr')
    if (tr) reveal(wrap, activate(wrap, String(find('.colist tr', wrap).indexOf(tr) + 1)))
  })

  window.addEventListener('load', function () {
    find('.annotated', doc).forEach(function (wrap) {
      activate(wrap, '1')
    })
  })

  function activate (wrap, n) {
    find('.conum', wrap).forEach(function (conum) {
      conum.classList.toggle('is-active', conum.getAttribute('data-value') === n)
    })
    find('.colist tr', wrap).forEach(function (tr, i) {
      tr.classList.toggle('is-active', String(i + 1) === n)
    })
    find('.line-hl', wrap).forEach(function (hl) {
      hl.parentNode.removeChild(hl)
    })
    var target = find('pre .conum', wrap).filter(function (conum) {
      return conum.getAttribute('data-value') === n && conum.offsetParent
    })[0]
    if (!target) return
    var pre = target.closest('pre')
    var host = pre.parentNode
    var lineHeight = parseFloat(window.getComputedStyle(pre).lineHeight) || 22
    var top = target.getBoundingClientRect().top - host.getBoundingClientRect().top +
      target.offsetHeight / 2 - lineHeight / 2
    var hl = document.createElement('div')
    hl.className = 'line-hl'
    hl.style.top = top + 'px'
    hl.style.height = lineHeight + 'px'
    host.appendChild(hl)
    return hl
  }

  // ---------- Scroll the window just enough to bring the counterpart of a click into view ----------
  function reveal (wrap, el) {
    if (!el) return
    var column = [].filter.call(wrap.children, function (child) {
      return child.contains(el)
    })[0]
    var style = window.getComputedStyle(column)
    // stacked (narrow) layout: jumping away would lose the reader's place
    if (style.position !== 'sticky') return
    var s0 = window.pageYOffset
    var wrapRect = wrap.getBoundingClientRect()
    var colRect = column.getBoundingClientRect()
    var elRect = el.getBoundingClientRect()
    var wrapTop = wrapRect.top + s0
    var bounds = stickyBounds(column)
    var colTop = colRect.top
    var offset = elRect.top - colRect.top
    var margin = 24
    var minTop = bounds[1] + margin
    var maxTop = Math.max(minTop, window.innerHeight - margin - elRect.height)
    // where el's top would sit in the viewport at scroll position s, following the column's sticky
    // behaviour for a steady scroll from s0; this never increases as s grows, so bisection finds the nearest s
    var topAt = function (s) {
      var natural = wrapTop - s
      var sticky = clamp(colTop - (s - s0), bounds[0], bounds[1])
      return Math.min(Math.max(natural, sticky), natural + wrapRect.height - colRect.height) + offset
    }
    var current = topAt(s0)
    if (current >= minTop && current <= maxTop) return
    var tooHigh = current < minTop
    var lo = tooHigh ? 0 : s0
    var hi = tooHigh ? s0 : Math.max(s0, document.documentElement.scrollHeight - window.innerHeight)
    for (var i = 0; i < 30; i++) {
      var mid = (lo + hi) / 2
      var top = topAt(mid)
      if (tooHigh ? top >= minTop : top > maxTop) lo = mid
      else hi = mid
    }
    window.scrollTo({ top: Math.round(tooHigh ? lo : hi), behavior: 'smooth' })
  }

  function find (selector, from) {
    return [].slice.call((from || document).querySelectorAll(selector))
  }
})()
