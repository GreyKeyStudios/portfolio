#!/usr/bin/env node
/**
 * Portfolio truth checks over lib/portfolio-projects.ts, lib/projects-data.ts
 * and the public/ media they reference.
 *
 * Two kinds of rule live here:
 *  - structural: unique ids, media that exists, statuses that agree with links
 *    and media provenance, no "live capture" without a live destination;
 *  - KNOWN FACTS confirmed by the owner. These are the claims that have been
 *    wrong before (titles, which persona a track belongs to, what Bridge
 *    Academy is). If one of these legitimately changes, change it here in the
 *    same commit — that is the point of writing them down.
 *
 *   node scripts/validate-portfolio.cjs
 */
const fs = require('node:fs')
const path = require('node:path')
const { ROOT, load } = require('./lib/load-ts.cjs')

const P = load('lib/portfolio-projects.ts')
const { HOME_OFFICE_PROJECTS } = load('lib/projects-data.ts')
const failures = []
const warnings = []
const check = (ok, msg) => { if (!ok) failures.push(msg) }
const exists = (url) => fs.existsSync(path.join(ROOT, 'public', decodeURI(url)))
const projects = P.PORTFOLIO_PROJECTS
const byId = new Map(projects.map(p => [p.id, p]))

// ── Structure ───────────────────────────────────────────────────────────────
check(byId.size === projects.length, 'duplicate project ids')
check(new Set(projects.map(p => p.slug)).size === projects.length, 'duplicate project slugs')
check(new Set(projects.map(p => p.name.toLowerCase())).size === projects.length, 'duplicate project names')
const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/
for (const p of projects) {
  check(kebab.test(p.id) && kebab.test(p.slug), `${p.id}: id/slug must be kebab-case`)
  check(p.hook?.trim() && p.description?.trim(), `${p.id}: missing hook or description`)
  for (const [kind, href] of Object.entries(p.links)) {
    if (kind === 'internal') check(/^\/[a-z0-9/-]*$/.test(href) && fs.existsSync(path.join(ROOT, 'app', href, 'page.tsx')), `${p.id}: internal link ${href} is not a route in app/`)
    else check(/^https:\/\/[^\s]+$/.test(href), `${p.id}: ${kind} link "${href}" is not an https URL`)
  }
  if (p.status === 'live') check(p.links.live, `${p.id}: status "live" without a live link`)
  if (p.status === 'concept') check(!p.links.live, `${p.id}: a concept must not point at a live site`)
  for (const m of p.media) {
    if (m.src) check(exists(m.src), `${p.id}: media ${m.src} does not exist under public/`)
    check(m.readiness !== 'ready' || m.src, `${p.id}: media "${m.label}" is ready but has no src`)
    // A "live" capture claims a live destination exists.
    if (/LIVE/.test(m.label)) check(p.links.live, `${p.id}: "${m.label}" without a live link`)
    if (p.status === 'concept') check(m.provenance !== 'real', `${p.id}: concept project carries media marked as a real capture`)
    if (m.kind === 'game-still' || m.kind === 'concept-art') check(m.provenance !== 'real', `${p.id}: concept art marked as real`)
  }
  // Stale copy that outlived its own media.
  if (p.media.some(m => m.provenance === 'real' && m.readiness === 'ready')) {
    check(!/media (is|are|remain\w*) (intentionally )?pending|imagery .* pending|awaiting verified product media/i.test(p.description), `${p.id}: description says media is pending, but real media ships`)
  }
}
for (const section of ['work', 'building', 'lab', 'game-lab', 'bridge', 'stack-house']) {
  const orders = projects.filter(p => p.homepage?.section === section && !p.held).map(p => p.homepage.order)
  check(new Set(orders).size === orders.length, `${section}: duplicate homepage order`)
}
check(P.SHIPPED_PROJECTS.every(p => p.status === 'live'), 'the "Things that work" section lists something that is not live')
check(P.GAME_PROJECTS.filter(p => p.category === 'game').every(p => p.media.every(m => m.provenance !== 'real' || p.status !== 'concept')), 'a game concept shows media presented as gameplay')

// ── Music identities ────────────────────────────────────────────────────────
const ids = P.MUSIC_IDENTITIES
const assets = ids.flatMap(i => [i.basePortrait, i.personaPortrait, i.logoFallback, i.artwork, ...i.projects.map(p => p.artwork).filter(Boolean)])
for (const a of assets) if (a.src) check(exists(a.src), `music asset ${a.src} does not exist under public/`)
check(new Set(ids.map(i => i.id)).size === ids.length, 'duplicate music identity ids')
const projectIds = ids.flatMap(i => i.projects.map(p => p.id))
check(new Set(projectIds).size === projectIds.length, 'a music project appears under more than one identity')

// ── KNOWN FACTS (owner-confirmed) ───────────────────────────────────────────
const named = (re) => projects.filter(p => re.test(p.name))
check(named(/^Kids at the Mall\b/).length === 1, 'KNOWN FACT: the game is "Kids at the Mall" (plural)')
check(named(/^The Floor Is Negotiable$/).length === 1, 'KNOWN FACT: the game is "The Floor Is Negotiable"')
check(!projects.some(p => /\bKid[ -]at[ -](the[ -])?Mall\b|Room[ -](Is[ -])?Negotiable/i.test(`${p.name} ${p.slug} ${p.id} ${p.media.map(m => m.src).join(' ')}`)), 'a superseded game title survives in an id, slug or asset path')

const bridge = byId.get('bridge-academy')
check(bridge && bridge.status === 'concept' && !bridge.links.live, 'KNOWN FACT: Bridge Academy is a proposed system, not an operating school')
check(bridge && /digital-first/i.test(bridge.description), 'KNOWN FACT: Bridge Academy is digital-first')
const bridgeSection = fs.readFileSync(path.join(ROOT, 'components/portfolio/bridge-academy-section.tsx'), 'utf8')
check(/FUTURE FLAGSHIP CAMPUS/.test(bridgeSection) && /Digital first/.test(bridgeSection), 'KNOWN FACT: the physical flagship is presented as future vision behind a digital-first start')
check(/Bridge Academy/.test(byId.get('relearn')?.description ?? ''), 'KNOWN FACT: ReLearn is intended to become Bridge Academy\'s learning engine — say so in its record')

const identity = (id) => ids.find(i => i.id === id)
const terra = ids.flatMap(i => i.projects.map(p => ({ i, p }))).filter(({ p }) => /Terra Gaia/i.test(p.title))
check(terra.length === 1 && terra[0].i.id === 'mr-e', 'KNOWN FACT: Destination: Terra Gaia is one EP (one Mr. E project record)')
const waltz = ids.flatMap(i => i.projects.map(p => ({ i, p }))).filter(({ p }) => p.trackCandidates.includes('1899 Waltz'))
// A released single that will also appear on the album Abstract Waltz (owner, 2026-10-02).
const waltzSingle = waltz.find(({ p }) => p.id === '1899-waltz')
check(waltz.every(({ i }) => i.id === 'adwo-nyumbani'), 'KNOWN FACT: "1899 Waltz" is an Adwo Nyumbani release')
check(waltzSingle && /feat\. Mr\. E/.test(waltzSingle.p.title) && waltzSingle.p.artwork?.src, 'KNOWN FACT: "1899 Waltz" is a single, Adwo Nyumbani featuring Mr. E, with its own artwork')
check(waltz.some(({ p }) => p.id === 'abstract-waltz'), 'KNOWN FACT: "1899 Waltz" also appears on the album Abstract Waltz')
const ch3 = identity('mr-e')?.projects.find(p => /Channel 3/i.test(p.title))
check(ch3 && /two-song/i.test(ch3.note ?? '') && ch3.trackCandidates.length <= 2, 'KNOWN FACT: Games On Channel 3 contains two songs')
// Michael and the personas are related but distinct presentation identities.
check(ids.every(i => !/michael|walton$/i.test(i.name) || i.id === 'walton-grey'), 'a persona is presented as Michael himself')
check(ids.every(i => i.basePortrait && /Michael Walton/.test(i.credits)), 'each persona should credit Michael Walton while keeping its own identity')
// GK Backlot and GK World are separate (related) projects — never one record.
check(!projects.some(p => /GK World/i.test(p.name) && /Backlot/i.test(p.name)), 'KNOWN FACT: GK Backlot and GK World are separate projects')
check(!/GK World/i.test(byId.get('gk-backlot')?.description ?? ''), 'GK Backlot\'s record must not describe itself as GK World')

// ── Home Office list must not contradict the portfolio record ────────────────
const STATUS_MAP = { live: 'live', concept: 'concept', 'in-development': 'in-progress', 'vertical-slice': 'in-progress', prototype: 'in-progress', scaffold: 'in-progress' }
const ALIASES = { 'sbm-inc': 'sbm', 'grey-key-studios': 'grey-key' }
for (const h of HOME_OFFICE_PROJECTS) {
  const p = byId.get(ALIASES[h.id] ?? h.id)
  if (!p) { warnings.push(`Home Office lists "${h.name}", which has no portfolio record — unverified`); continue }
  check(STATUS_MAP[p.status] === h.status, `Home Office says ${h.name} is "${h.status}", portfolio says "${p.status}"`)
  if (h.url && p.links.live) check(h.url.replace(/\/$/, '') === p.links.live.replace(/\/$/, ''), `Home Office URL for ${h.name} differs from the portfolio record`)
}
check(!HOME_OFFICE_PROJECTS.some(h => /alias/i.test(h.description) && /grey key studios/i.test(h.name)), 'Grey Key Studios is the studio, not one of Michael\'s aliases')

// ── Orphans: shipped media nothing references ────────────────────────────────
const referenced = new Set([...projects.flatMap(p => p.media.map(m => m.src)), ...assets.map(a => a.src)].filter(Boolean))
const code = ['app', 'components', 'lib'].flatMap(d => fs.readdirSync(path.join(ROOT, d), { recursive: true }).map(f => path.join(ROOT, d, f))).filter(f => /\.(tsx?|css|json)$/.test(f)).map(f => fs.readFileSync(f, 'utf8')).join('\n')
for (const f of fs.readdirSync(path.join(ROOT, 'public/portfolio'), { recursive: true })) {
  const url = `/portfolio/${f.split(path.sep).join('/')}`
  if (!/\.(png|jpe?g|webp|gif|svg|mp3|m4a|ogg)$/i.test(url)) continue
  if (!referenced.has(url) && !code.includes(url)) warnings.push(`${url} ships but nothing references it`)
}

for (const w of warnings) console.warn(`  ! ${w}`)
if (failures.length) {
  console.error(`validate-portfolio: ${failures.length} problem(s)\n` + failures.map(f => `  ✗ ${f}`).join('\n'))
  process.exit(1)
}
console.log(`validate-portfolio: ok — ${projects.length} projects, ${ids.length} music identities${warnings.length ? `, ${warnings.length} warning(s)` : ''}`)
