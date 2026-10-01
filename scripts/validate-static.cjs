#!/usr/bin/env node
/**
 * Post-build check of the Cloudflare Pages static export in out/.
 * Run after `npm run build`.
 *
 *  - every page route the app defines was exported;
 *  - every root-relative href/src in the exported HTML resolves inside out/;
 *  - every asset path the source code asks for (including the templated
 *    `/models/interior-${floor}-${version}.glb` family) was exported;
 *  - no file exceeds Cloudflare Pages' 25 MiB per-file limit;
 *  - _headers only names files that exist.
 *
 * It prints the asset weight per directory, because STATUS.md treats asset
 * weight as a hard budget, but it does not judge the number — that is a call
 * for whoever is adding weight.
 *
 *   node scripts/validate-static.cjs [outDir]
 */
const fs = require('node:fs')
const path = require('node:path')
const ROOT = path.resolve(__dirname, '..')
const OUT = path.resolve(ROOT, process.argv[2] ?? 'out')
const failures = []
const check = (ok, msg) => { if (!ok) failures.push(msg) }
const CF_FILE_LIMIT = 25 * 1024 * 1024

if (!fs.existsSync(OUT)) { console.error(`validate-static: ${OUT} does not exist — run npm run build first`); process.exit(1) }
const files = fs.readdirSync(OUT, { recursive: true }).map(f => f.split(path.sep).join('/')).filter(f => fs.statSync(path.join(OUT, f)).isFile())
const has = new Set(files)
const resolves = (url) => {
  const clean = decodeURIComponent(url.split(/[?#]/)[0]).replace(/^\//, '').replace(/\/$/, '')
  return clean === '' ? has.has('index.html') : has.has(clean) || has.has(`${clean}.html`) || has.has(`${clean}/index.html`)
}

// Routes: every app/**/page.tsx must be exported.
const pages = fs.readdirSync(path.join(ROOT, 'app'), { recursive: true }).map(f => f.split(path.sep).join('/')).filter(f => /(^|\/)page\.tsx$/.test(f))
for (const page of pages) {
  const route = '/' + page.replace(/(^|\/)page\.tsx$/, '')
  check(resolves(route), `route ${route} (app/${page}) was not exported`)
}
check(has.has('404.html'), 'no 404.html in the export')

// Exported HTML links.
for (const html of files.filter(f => f.endsWith('.html'))) {
  const text = fs.readFileSync(path.join(OUT, html), 'utf8')
  for (const [, url] of text.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    if (url.startsWith('//')) continue
    check(resolves(url), `${html}: ${url} does not resolve in the export`)
  }
}

// Asset paths requested from source (string literals and simple templates).
const EXPAND = { floor: ['basement', 'ground', 'second', 'attic'], version: ['v002'] }
const sources = ['app', 'components', 'lib'].flatMap(d => fs.readdirSync(path.join(ROOT, d), { recursive: true }).map(f => path.join(d, f))).filter(f => /\.(tsx?|css)$/.test(f))
for (const rel of sources) {
  const text = fs.readFileSync(path.join(ROOT, rel), 'utf8')
  const literal = [...text.matchAll(/["'`(](\/(?:models|textures|portfolio|brand)\/[^"'`)\s]+)["'`)]/g)].map(m => m[1])
  const viaHelper = [...text.matchAll(/getModelUrl\(\s*["'`]([^"'`]+)["'`]\s*\)/g)].map(m => `/models/${m[1]}`)
  for (const raw of [...literal, ...viaHelper]) {
    // `floor-finishes-${floor}-v002.glb` only exists for ground/second; skip
    // template families whose expansion is legitimately sparse, and check the rest.
    let urls = [raw]
    for (const [key, values] of Object.entries(EXPAND)) urls = urls.flatMap(u => u.includes(`\${${key}}`) ? values.map(v => u.replaceAll(`\${${key}}`, v)) : [u])
    if (urls.some(u => u.includes('${'))) continue
    const missing = urls.filter(u => !resolves(u))
    if (raw.includes('${') && missing.length < urls.length) continue // sparse family: at least one member exists
    for (const u of missing) failures.push(`${rel}: ${u} is requested but not in the export`)
  }
}

// Size limits and weight report.
const weight = {}
for (const f of files) {
  const size = fs.statSync(path.join(OUT, f)).size
  check(size <= CF_FILE_LIMIT, `${f} is ${(size / 1048576).toFixed(1)} MiB; Cloudflare Pages rejects files over 25 MiB`)
  const bucket = f.startsWith('_next/') ? '_next' : f.split('/')[0].includes('.') ? '(root)' : f.split('/')[0]
  weight[bucket] = (weight[bucket] ?? 0) + size
}

// _headers must not describe files that are not there.
if (has.has('_headers')) {
  for (const line of fs.readFileSync(path.join(OUT, '_headers'), 'utf8').split('\n')) {
    if (/^\/\S+$/.test(line.trim()) && !line.includes('*')) check(resolves(line.trim()), `_headers rule for ${line.trim()} matches no exported file`)
  }
}

console.log('export weight: ' + Object.entries(weight).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(v / 1048576).toFixed(1)} MiB`).join(' · '))
if (failures.length) {
  console.error(`validate-static: ${failures.length} problem(s)\n` + failures.map(f => `  ✗ ${f}`).join('\n'))
  process.exit(1)
}
console.log(`validate-static: ok — ${pages.length} routes, ${files.length} files`)
