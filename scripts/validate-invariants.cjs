#!/usr/bin/env node
/**
 * Tripwires for the rendering / deploy constraints in STATUS.md
 * ("Load-bearing constraints"). These are source-level checks: they cannot
 * prove a frame is fast or a scene looks right — that is a local browser job —
 * but they fail loudly when someone removes the guard that a past regression
 * taught us to keep. If a constraint is changed DELIBERATELY, update STATUS.md
 * and this file in the same commit.
 *
 *   node scripts/validate-invariants.cjs
 */
const fs = require('node:fs')
const path = require('node:path')
const ROOT = path.resolve(__dirname, '..')
// Comments are stripped so an explanation of a past mistake never trips the check for it.
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
const failures = []
const check = (ok, msg) => { if (!ok) failures.push(msg) }

const house = read('app/house/page.tsx')
const effects = read('components/scene-effects.tsx')
const nextConfig = read('next.config.mjs')

// Fixed light pool: changing the NUMBER of lights recompiles every material.
check(/const POOL_SIZE = 8\b/.test(house), 'POOL_SIZE must stay 8 (STATUS: fixed light pool)')
// Component lights go through the pool (lib/light-pool.ts). A <pointLight> inside
// the yard or a floor group drops out of the light count whenever that group is
// hidden — the count changed on every yard/house and basement crossing until
// 2026-10-01, recompiling every material each time.
const POOLED = ['front-door.tsx', 'street-lamp.tsx', 'touch-grass.tsx', 'interior/home-office-room.tsx']
for (const f of POOLED) check(!/<pointLight\b/.test(read(path.join('components', f))), `components/${f} must register its light with usePoolLight, not mount a <pointLight>`)
check(/Array\.from\(\{ length: POOL_SIZE \}/.test(house), 'the light pool must render exactly POOL_SIZE lights, permanently mounted')
const lightTags = (house.match(/<pointLight\b/g) ?? []).length
check(lightTags === 1, `app/house/page.tsx declares ${lightTags} <pointLight> elements; all point lights belong to the pool`)
// Gated only on a prop that is fixed for the session (the architecture choice),
// so it never toggles while the scene runs.
const CONDITIONAL_LIGHT_OK = new Set(['interior/exit-door.tsx'])
for (const file of fs.readdirSync(path.join(ROOT, 'components'), { recursive: true }).filter(f => /\.tsx$/.test(f))) {
  const text = read(path.join('components', file))
  // A light that is conditionally rendered changes the active count.
  if (!CONDITIONAL_LIGHT_OK.has(file.split(path.sep).join('/'))) check(!/&&\s*\(?\s*<(pointLight|spotLight)\b/.test(text), `components/${file}: a conditionally mounted light changes the light count (use a pool slot and dim it)`)
}
// The architecture choice must not start as null: that mounts legacy lights and
// unmounts them a frame later (light-count change → full recompile on load).
check(/useState<string \| null>\('v002'\)/.test(house), "Scene must initialise architectureCandidate to 'v002', not null")

// Neighbour floors stay visible — culling to the active floor shows a void down the stairwell.
check(/Math\.abs\(FLOOR_ORDER\.indexOf\(active as InteriorFloor\) - FLOOR_ORDER\.indexOf\(floor\)\) <= 1/.test(house), 'nearFloor() must keep the floors directly above and below visible')
// Interior and yard stay mounted; visibility flips instead of mount/unmount.
check(/<group visible=\{!isYard\}[^>]*>/.test(house), 'the interior must stay mounted and be hidden with visible={!isYard}')

// Post-processing: desktop only, gated by the same isMobile flag as controls.
check(/\{!isMobile && <SceneEffects \/>\}/.test(house), 'SceneEffects must be gated by !isMobile')
check(/enableNormalPass=\{false\}/.test(effects), 'EffectComposer must keep enableNormalPass={false}')
check(/\bhalfRes\b/.test(effects), 'N8AO must stay halfRes')
// isMobile decides on INPUT, not touch-point count (Windows reports 10).
check(/any-pointer: fine/.test(house) && /any-hover: hover/.test(house), 'mobile detection must use any-pointer / any-hover')
check(!/maxTouchPoints\s*>\s*2/.test(house), 'maxTouchPoints > 2 misclassifies touch-capable Windows desktops as phones')
check(/get\('controls'\)/.test(house) && /forced === 'desktop'/.test(house) && /forced === 'touch'/.test(house), '?controls=desktop|touch override must remain')

// Render resolution: STATUS 2026-09-08 lowered the cap to 1 device pixel per CSS pixel.
const dpr = house.match(/\bdpr=\{([^}]+)\}/)
check(dpr && (dpr[1].trim() === '1' || /^\[\s*1\s*,\s*1(\.\d+)?\s*\]$/.test(dpr[1].trim())), `house Canvas dpr is ${dpr ? dpr[1] : 'unset'}; r3f defaults to [1,2] — keep it capped (currently 1)`)
check(/powerPreference: 'high-performance'/.test(house), "house Canvas must request powerPreference: 'high-performance'")

// glTF transmission makes three.js re-render every opaque object into a second
// target whenever the material is on screen; one shower screen halved the
// interior frame rate (STATUS 2026-10-01). Interior assets go through
// stripTransmission; any other GLB that ships transmission fails here.
const candidate = read('components/interior/architecture-candidate.tsx')
check(/stripTransmission\(child\.material\)/.test(candidate), 'CandidateAsset must call stripTransmission on every interior mesh')
for (const f of fs.readdirSync(path.join(ROOT, 'public/models')).filter(f => f.endsWith('.glb'))) {
  const bytes = fs.readFileSync(path.join(ROOT, 'public/models', f))
  const json = bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString('utf8')
  if (!json.includes('KHR_materials_transmission')) continue
  // Interior shells/furniture are loaded by CandidateAsset, by literal or templated URL.
  const viaCandidate = candidate.includes(`/models/${f}`) || /-v00\d\.glb$/.test(f) && /^(interior|floor-finishes|staircase)-/.test(f)
  check(viaCandidate, `public/models/${f} uses KHR_materials_transmission but is not loaded through CandidateAsset (stripTransmission)`)
}

// Tailwind runs through PostCSS; an empty config silently disables every utility
// class (it shipped that way until 2026-10-01). Preflight stays off — see tailwind.config.js.
check(/tailwindcss/.test(read('postcss.config.mjs')), 'postcss.config.mjs must load tailwindcss')
check(/preflight:\s*false/.test(read('tailwind.config.js')), 'tailwind.config.js must keep preflight: false (gate/portfolio CSS assumes browser defaults)')

// Cloudflare Pages static export.
check(/output:\s*'export'/.test(nextConfig), "next.config.mjs must keep output: 'export' (Cloudflare Pages)")
check(/unoptimized:\s*true/.test(nextConfig), 'static export requires images.unoptimized')
for (const dir of ['app']) {
  for (const f of fs.readdirSync(path.join(ROOT, dir), { recursive: true })) {
    if (/(^|\/)route\.(t|j)sx?$/.test(f)) failures.push(`${dir}/${f}: API routes cannot ship in a static export`)
    if (/\[.+\]/.test(f)) {
      const text = read(path.join(dir, f))
      if (/page\.tsx$/.test(f) && !/generateStaticParams/.test(text)) failures.push(`${dir}/${f}: dynamic route without generateStaticParams breaks static export`)
    }
  }
}
for (const f of fs.readdirSync(path.join(ROOT, 'app'), { recursive: true }).filter(f => /\.tsx?$/.test(f))) {
  const text = read(path.join('app', f))
  check(!/from ['"]next\/(headers|server)['"]/.test(text), `app/${f}: next/headers and next/server need a server, not a static export`)
}

if (failures.length) {
  console.error(`validate-invariants: ${failures.length} problem(s)\n` + failures.map(f => `  ✗ ${f}`).join('\n'))
  process.exit(1)
}
console.log('validate-invariants: ok — light pool, floor visibility, post/mobile gating, DPR, static export')
