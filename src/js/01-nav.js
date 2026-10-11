;(function () {
  'use strict'

  var nav = document.querySelector('.nav')
  if (!nav) return

  // ---------- Mobile nav ----------
  var navToggle = document.querySelector('.nav-toggle')
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open')
      navToggle.setAttribute('aria-expanded', String(open))
    })
  }

  // ---------- Nav tree ----------
  find('.nav-item-toggle', nav).forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.closest('.nav-item').classList.toggle('is-active')
    })
  })
  find('.nav-row > .nav-text', nav).forEach(function (el) {
    el.style.cursor = 'pointer'
    el.addEventListener('click', function () {
      el.closest('.nav-item').classList.toggle('is-active')
    })
  })

  // expand only the branch containing the current page, and scroll it into view
  var current = nav.querySelector('.nav-item.is-current-page')
  if (current) {
    var el = current
    while (el && el !== nav) {
      if (el.classList && el.classList.contains('nav-item')) el.classList.add('is-active')
      el = el.parentNode
    }
    var scroller = nav.querySelector('.nav-scroll')
    var top = current.getBoundingClientRect().top - scroller.getBoundingClientRect().top
    if (top > scroller.clientHeight * 0.7) scroller.scrollTop = top - scroller.clientHeight / 3
  }

  // ---------- Filter pages ----------
  var filter = nav.querySelector('.nav-filter')
  if (filter) {
    filter.addEventListener('input', function () {
      var q = filter.value.trim().toLowerCase()
      nav.classList.toggle('is-filtering', !!q)
      find('.nav-item', nav).forEach(function (item) {
        item.classList.toggle('is-filtered-out', !!q && item.textContent.toLowerCase().indexOf(q) < 0)
      })
      find('.nav-group', nav).forEach(function (group) {
        group.classList.toggle('is-filtered-out', !!q && !group.querySelector('.nav-item:not(.is-filtered-out)'))
      })
    })
  }

  function find (selector, from) {
    return [].slice.call((from || document).querySelectorAll(selector))
  }
})()
