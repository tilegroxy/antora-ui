;(function () {
  'use strict'

  // An options table has one of these as its first header, a Description column,
  // and at least one of Type, Required or Default
  var NAME_RX = /^(parameter|option|flag|name|key|field|property|setting)$/
  var NO_DEFAULT_RX = /^(none|n\/a|-)$/i
  var REQUIRED_RX = /^(yes|true|required)$/i

  var doc = document.querySelector('article.doc')
  if (!doc) return

  var usedIds = {}

  // ---------- Option tables -> option lists ----------
  find('table.tableblock', doc).forEach(function (table, tableIdx) {
    if (table.classList.contains('nooptions') || !table.tHead || !table.tBodies[0]) return
    var heads = [].map.call(table.tHead.rows[0].cells, function (cell) {
      return cell.textContent.trim().toLowerCase()
    })
    var col = function (rx) {
      for (var i = 0; i < heads.length; i++) {
        if (rx.test(heads[i])) return i
      }
      return -1
    }
    var iName = col(NAME_RX)
    var iDesc = col(/^description$/)
    var iType = col(/^type$/)
    var iReq = col(/^required$/)
    var iDef = col(/^default/)
    var iGroup = col(/^(group|category|section)$/)
    if (iName !== 0 || iDesc < 0 || (iType < 0 && iReq < 0 && iDef < 0)) return
    if (table.querySelector('td[rowspan], td[colspan]')) return

    var rows = [].map.call(table.tBodies[0].rows, function (tr) {
      var cells = tr.cells
      var name = text(cells[iName])
      var nameCode = cells[iName].querySelector('code')
      var id = 'opt-' + slug(name)
      if (usedIds[id]) id += '-' + tableIdx
      usedIds[id] = true
      return {
        name: name,
        nameHtml: nameCode ? nameCode.innerHTML : escapeHtml(name),
        id: id,
        desc: cellHtml(cells[iDesc]),
        type: iType >= 0 ? text(cells[iType]) : '',
        req: iReq >= 0 && REQUIRED_RX.test(text(cells[iReq])),
        def: iDef >= 0 ? cellHtml(cells[iDef]) : '',
        defText: iDef >= 0 ? text(cells[iDef]) : '',
        group: iGroup >= 0 ? text(cells[iGroup]) : '',
        search: tr.textContent.toLowerCase(),
      }
    })

    var list = document.createElement('div')
    list.className = 'option-list'
    if (table.caption) {
      var title = document.createElement('div')
      title.className = 'title'
      title.textContent = table.caption.textContent.trim()
      list.appendChild(title)
    }
    var bar = document.createElement('div')
    bar.className = 'option-bar'
    var rowsEl = document.createElement('div')
    rowsEl.className = 'option-rows'
    var groups = []
    rows.forEach(function (row) {
      if (groups.indexOf(row.group) < 0) groups.push(row.group)
    })
    var namedGroups = groups.filter(Boolean)
    var noun = /flag/.test(heads[0]) ? 'flags' : 'options'
    var requiredCount = rows.filter(function (row) { return row.req }).length

    var filterable =
      !table.classList.contains('nofilter') && (rows.length >= 6 || table.classList.contains('filterable'))
    var input
    if (filterable) {
      input = document.createElement('input')
      input.type = 'search'
      input.className = 'option-filter'
      input.placeholder = 'Filter ' + rows.length + ' ' + noun
      input.setAttribute('aria-label', input.placeholder)
      bar.appendChild(input)
    }

    var activeGroup = null
    var chipWrap = document.createElement('div')
    chipWrap.className = 'option-groups'
    if (namedGroups.length > 1) {
      ;[null].concat(namedGroups).forEach(function (group) {
        var chip = document.createElement('button')
        chip.type = 'button'
        chip.className = 'option-group-chip' + (group === null ? ' is-active' : '')
        chip.textContent = group === null ? 'All' : group
        chip.addEventListener('click', function () {
          activeGroup = group
          find('.option-group-chip', chipWrap).forEach(function (it) {
            it.classList.toggle('is-active', it === chip)
          })
          render()
        })
        chipWrap.appendChild(chip)
      })
      bar.appendChild(chipWrap)
    }
    var count = document.createElement('span')
    count.className = 'option-count'
    bar.appendChild(count)
    if (filterable || namedGroups.length > 1 || rows.length > 3) list.appendChild(bar)
    list.appendChild(rowsEl)

    var groupEls = {}
    groups.forEach(function (group) {
      var wrap = document.createElement('div')
      wrap.className = 'option-group'
      if (group) {
        var heading = document.createElement('div')
        heading.className = 'option-group-title'
        heading.textContent = group
        wrap.appendChild(heading)
      }
      rowsEl.appendChild(wrap)
      groupEls[group] = wrap
    })
    rows.forEach(function (row) {
      var el = document.createElement('div')
      el.className = 'option'
      el.id = row.id
      var showDefault = row.defText && !NO_DEFAULT_RX.test(row.defText)
      el.innerHTML =
        '<div class="option-name"><a href="#' + row.id + '">' + row.nameHtml + '</a><div class="option-meta">' +
        (row.type ? '<span class="option-type"></span>' : '') +
        (row.req ? '<span class="option-required">Required</span>' : '') +
        '</div></div><div class="option-body"><div class="option-desc">' + row.desc + '</div>' +
        (showDefault
          ? '<div class="option-default">Default <code>' + row.def.replace(/<\/?p>/g, '') + '</code></div>'
          : '') +
        '</div>'
      if (row.type) el.querySelector('.option-type').textContent = row.type
      row.el = el
      groupEls[row.group].appendChild(el)
    })
    var empty = document.createElement('div')
    empty.className = 'option-empty'
    empty.hidden = true
    rowsEl.appendChild(empty)

    function render () {
      var q = input ? input.value.trim().toLowerCase() : ''
      var shown = 0
      rows.forEach(function (row) {
        var on = (!q || row.search.indexOf(q) >= 0) && (activeGroup === null || row.group === activeGroup)
        row.el.hidden = !on
        if (on) shown++
      })
      groups.forEach(function (group) {
        groupEls[group].hidden = !rows.some(function (row) { return row.group === group && !row.el.hidden })
      })
      empty.hidden = shown > 0
      empty.textContent = 'No ' + noun + ' match "' + q + '".'
      count.textContent = (shown < rows.length ? shown + ' of ' : '') + rows.length + ' ' + noun +
        (requiredCount ? ' · ' + requiredCount + ' required' : '')
    }
    if (input) input.addEventListener('input', render)
    render()

    table.parentNode.insertBefore(list, table)
    table.parentNode.removeChild(table)
  })

  // ---------- Generic filter for other large tables ----------
  find('table.tableblock', doc).forEach(function (table) {
    var body = table.tBodies[0]
    if (!body || table.classList.contains('nofilter') || table.querySelector('td[rowspan]')) return
    var rows = [].slice.call(body.rows)
    if (rows.length < 10 && !table.classList.contains('filterable')) return
    var bar = document.createElement('div')
    bar.className = 'option-bar'
    var input = document.createElement('input')
    input.type = 'search'
    input.className = 'option-filter'
    input.placeholder = 'Filter ' + rows.length + ' rows'
    input.setAttribute('aria-label', input.placeholder)
    var count = document.createElement('span')
    count.className = 'option-count'
    bar.appendChild(input)
    bar.appendChild(count)
    // lift the caption out of the table so it sits above the filter bar
    if (table.caption) {
      var title = document.createElement('div')
      title.className = 'title'
      title.textContent = table.caption.textContent.trim()
      table.parentNode.insertBefore(title, table)
      table.removeChild(table.caption)
    }
    table.parentNode.insertBefore(bar, table)
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase()
      var shown = 0
      rows.forEach(function (tr) {
        var on = !q || tr.textContent.toLowerCase().indexOf(q) >= 0
        tr.hidden = !on
        if (on) shown++
      })
      count.textContent = q ? shown + ' of ' + rows.length : ''
    })
  })

  // ---------- Wide tables scroll inside their own box ----------
  find('table.tableblock', doc).forEach(function (table) {
    var wrap = document.createElement('div')
    wrap.className = 'table-scroll'
    table.parentNode.insertBefore(wrap, table)
    wrap.appendChild(table)
  })

  function slug (str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  function text (cell) {
    return cell ? cell.textContent.trim() : ''
  }

  function escapeHtml (str) {
    var div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }

  function cellHtml (cell) {
    if (!cell) return ''
    var paras = find('p.tableblock', cell)
    if (paras.length) return paras.map(function (p) { return '<p>' + p.innerHTML + '</p>' }).join('')
    return (cell.querySelector('.content') || cell).innerHTML
  }

  function find (selector, from) {
    return [].slice.call((from || document).querySelectorAll(selector))
  }
})()
