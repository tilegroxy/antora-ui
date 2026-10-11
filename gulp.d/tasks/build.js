'use strict'

const autoprefixer = require('autoprefixer')
const browserify = require('browserify')
const concat = require('gulp-concat')
const cssnano = require('cssnano')
const fs = require('fs-extra')
const merge = require('merge-stream')
const ospath = require('path')
const path = ospath.posix
const postcss = require('gulp-postcss')
const postcssCalc = require('postcss-calc')
const postcssImport = require('postcss-import')
const postcssUrl = require('postcss-url')
const postcssVar = require('postcss-custom-properties')
const { Readable, Transform } = require('stream')
const map = (transform) => new Transform({ objectMode: true, transform })
const through = () => map((file, enc, next) => next(null, file))
const uglify = require('gulp-uglify')
const vfs = require('vinyl-fs')

module.exports = (src, dest, preview) => () => {
  const opts = { base: src, cwd: src }
  const sourcemaps = preview || process.env.SOURCEMAPS === 'true'
  const postcssPlugins = [
    postcssImport,
    (css, { messages, opts: { file } }) =>
      Promise.all(
        messages
          .reduce((accum, { file: depPath, type }) => (type === 'dependency' ? accum.concat(depPath) : accum), [])
          .map((importedPath) => fs.stat(importedPath).then(({ mtime }) => mtime))
      ).then((mtimes) => {
        const newestMtime = mtimes.reduce((max, curr) => (!max || curr > max ? curr : max), file.stat.mtime)
        if (newestMtime > file.stat.mtime) file.stat.mtimeMs = +(file.stat.mtime = newestMtime)
      }),
    postcssUrl([
      {
        filter: (asset) => /^[~][^/]*(?:font|typeface)[^/]*\/.*\/files\/.+[.](?:ttf|woff2?)$/.test(asset.url),
        url: (asset) => {
          const relpath = asset.pathname.slice(1)
          const abspath = require.resolve(relpath)
          const basename = ospath.basename(abspath)
          const destpath = ospath.join(dest, 'font', basename)
          if (!fs.pathExistsSync(destpath)) fs.copySync(abspath, destpath)
          return path.join('..', 'font', basename)
        },
      },
    ]),
    postcssVar({ preserve: preview }),
    // NOTE to make vars.css available to all top-level stylesheets, use the next line in place of the previous one
    //postcssVar({ importFrom: path.join(src, 'css', 'vars.css'), preserve: preview }),
    preview ? postcssCalc : () => {}, // cssnano already applies postcssCalc
    autoprefixer,
    ...(preview ? [] : [cssnano({ preset: 'default' }), postcssPseudoElementFixer]),
  ]

  return merge(
    srcIfExists('ui.yml', { ...opts, allowEmpty: true }),
    srcIfExists('js/+([0-9])-*.js', { ...opts, read: false, sourcemaps })
      .pipe(bundle(opts))
      .pipe(uglify({ output: { comments: /^! / } }))
      // NOTE concat already uses stat from newest combined file
      .pipe(concat('js/site.js')),
    srcIfExists('js/vendor/+([^.])?(.bundle).js', { ...opts, read: false })
      .pipe(bundle(opts))
      .pipe(uglify({ output: { comments: /^! / } })),
    srcIfExists('js/vendor/*.min.js', opts)
      .pipe(map((file, enc, next) => next(null, Object.assign(file, { extname: '' }, { extname: '.js' })))),
    // NOTE use the next line to bundle a JavaScript library that cannot be browserified, like jQuery
    //vfs.src(require.resolve('<package-name-or-require-path>'), opts).pipe(concat('js/vendor/<library-name>.js')),
    srcIfExists(['css/site.css', 'css/vendor/*.css'], { ...opts, sourcemaps })
      .pipe(postcss((file) => ({ plugins: postcssPlugins, options: { file } }))),
    srcIfExists('font/*.{ttf,woff*(2)}', { ...opts, encoding: false }),
    srcIfExists('img/**/*.{gif,ico,jpg,png,svg}', { ...opts, encoding: false }).pipe(
      preview
        ? through()
        : imagemin([
          ['imagemin-gifsicle'],
          ['imagemin-jpegtran'],
          ['imagemin-optipng'],
          [
            'imagemin-svgo',
            {
              plugins: [
                {
                  name: 'preset-default',
                  params: { overrides: { cleanupIds: { preservePrefixes: ['icon-', 'view-'] }, removeDesc: false } },
                },
              ],
            },
          ],
        ])
    ),
    srcIfExists('helpers/*.js', opts),
    srcIfExists('layouts/*.hbs', opts),
    srcIfExists('partials/*.hbs', opts),
    srcIfExists('static/**/*[!~]', { ...opts, base: ospath.join(src, 'static'), dot: true, encoding: false })
  ).pipe(vfs.dest(dest, { sourcemaps: sourcemaps && '.' }))
}

// NOTE vinyl-fs 4 fails if the base directory of a glob does not exist, so drop globs for missing (optional) paths;
// the result is piped through a core stream since merge-stream relies on pipe({ end: false }), which streamx ignores
function srcIfExists (globs, opts) {
  globs = [].concat(globs).filter((glob) => {
    const segments = glob.split('/')
    const globIdx = segments.findIndex((it) => /[*?{}()[\]!+@]/.test(it))
    return fs.pathExistsSync(ospath.join(opts.cwd, ...(~globIdx ? segments.slice(0, globIdx) : segments)))
  })
  return globs.length ? vfs.src(globs, opts).pipe(through()) : Readable.from([])
}

function bundle ({ base: basedir, ext: bundleExt = '.bundle.js' }) {
  return map((file, enc, next) => {
    if (bundleExt && file.relative.endsWith(bundleExt)) {
      const mtimePromises = []
      const bundlePath = file.path
      browserify(file.relative, { basedir, detectGlobals: false })
        .plugin('browser-pack-flat/plugin')
        .on('file', (bundledPath) => {
          if (bundledPath !== bundlePath) mtimePromises.push(fs.stat(bundledPath).then(({ mtime }) => mtime))
        })
        .bundle((bundleError, bundleBuffer) =>
          Promise.all(mtimePromises).then((mtimes) => {
            const newestMtime = mtimes.reduce((max, curr) => (curr > max ? curr : max), file.stat.mtime)
            if (newestMtime > file.stat.mtime) file.stat.mtimeMs = +(file.stat.mtime = newestMtime)
            if (bundleBuffer !== undefined) file.contents = bundleBuffer
            next(bundleError, Object.assign(file, { path: file.path.slice(0, file.path.length - 10) + '.js' }))
          })
        )
      return
    }
    fs.readFile(file.path, 'UTF-8').then((contents) => {
      next(null, Object.assign(file, { contents: Buffer.from(contents) }))
    })
  })
}

// NOTE imagemin and its plugins are ES modules, so they're imported on first use
function imagemin (plugins) {
  let minify
  return map((file, enc, next) => {
    minify ??= Promise.all(
      ['imagemin', ...plugins.map(([name]) => name)].map((name) => import(name).then((m) => m.default))
    ).then(([{ buffer }, ...factories]) => (contents) =>
      buffer(contents, { plugins: factories.map((factory, idx) => factory(plugins[idx][1])) })
    )
    minify
      .then((fn) => fn(file.contents))
      .then((contents) => next(null, Object.assign(file, { contents: Buffer.from(contents) })), next)
  })
}

const postcssPseudoElementFixer = {
  postcssPlugin: 'postcss-pseudo-element-fixer',
  OnceExit (css) {
    css.walkRules(/(?:^|[^:]):(?:before|after)/, (rule) => {
      rule.selector = rule.selectors.map((it) => it.replace(/(^|[^:]):(before|after)$/, '$1::$2')).join(',')
    })
  },
}
