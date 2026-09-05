/**
 * Draws the four exterior elevations of the interior shell to docs/elevations.svg.
 *
 * Run: npm run elevations
 *
 * WHY THIS EXISTS
 * Window placement is authored per ROOM, from inside, one room at a time — but
 * it is JUDGED per ELEVATION, from outside, all at once. Those are different
 * views of the same data and it is entirely possible for every room to look
 * sensible on its own while the facade reads as a hotel: the first window pass
 * put 37 openings in this house, including one in the pantry and one in the
 * linen closet, and none of that is visible from any position a player can
 * stand in, because the interior scene has no exterior. It lives alone at
 * X0=300 with light only inside its rooms, so pointing the camera at the
 * outside of the shell renders black.
 *
 * This is the missing view. It is a drawing, not a render, and that is the
 * point — it answers "how many windows does the front of this house have and do
 * they line up" in one glance.
 */

const fs = require('fs')
const path = require('path')

const LAYOUT = path.join(__dirname, '..', '.interior-build', 'interior-layout.js')
if (!fs.existsSync(LAYOUT)) {
  console.error('Missing', LAYOUT, '\nRun `npm run build:interior` first (it transpiles the layout).')
  process.exit(1)
}
const {
  ROOMS, X0, HOUSE_W, HOUSE_D, FLOOR_BASE_Y, WINDOW_SILL, WINDOW_HEAD,
} = require(LAYOUT)

// Matches build-interior.cjs. Duplicated rather than imported because that file
// is a generator with side effects, not a module.
const ATTIC_KNEE_H = 1.15
const ATTIC_RIDGE_H = 3.9
const DOOR_H = 2.05

const PX = 42          // pixels per metre
const PAD = 54
const GAP = 66

const LOW = FLOOR_BASE_Y.basement            // -3.2
const HIGH = FLOOR_BASE_Y.attic + ATTIC_RIDGE_H

/**
 * Each elevation, with the axis its horizontal runs along.
 *
 * `lo`/`hi` bound that axis in world units, and `flip` mirrors the drawing so
 * every elevation is drawn as seen from OUTSIDE looking in — without it the
 * north and west faces come out backwards and stop being comparable to the
 * ones opposite them.
 */
const VIEWS = [
  { side: 'south', title: 'SOUTH — front / street', axis: 'x', lo: X0 - HOUSE_W / 2, hi: X0 + HOUSE_W / 2, flip: false },
  { side: 'north', title: 'NORTH — back / yard', axis: 'x', lo: X0 - HOUSE_W / 2, hi: X0 + HOUSE_W / 2, flip: true },
  { side: 'east', title: 'EAST — side', axis: 'z', lo: 0, hi: HOUSE_D, flip: false },
  { side: 'west', title: 'WEST — side', axis: 'z', lo: 0, hi: HOUSE_D, flip: true },
]

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function drawView(view, ox, oy) {
  const span = view.hi - view.lo
  const W = span * PX
  const H = (HIGH - LOW) * PX

  // world -> local pixels
  const px = (v) => (view.flip ? (view.hi - v) : (v - view.lo)) * PX
  const py = (y) => (HIGH - y) * PX

  const out = []
  out.push(`<g transform="translate(${ox},${oy})">`)
  out.push(`<text x="0" y="-30" class="t">${esc(view.title)}</text>`)

  // Below-grade band, so basement openings read as window wells rather than
  // as a storey somebody forgot to draw a door on.
  out.push(`<rect x="0" y="${py(0)}" width="${W}" height="${py(LOW) - py(0)}" class="below"/>`)

  // Wall mass, storey by storey.
  for (const f of ['basement', 'ground', 'second']) {
    const b = FLOOR_BASE_Y[f]
    out.push(`<rect x="0" y="${py(b + 3.2)}" width="${W}" height="${3.2 * PX}" class="wall"/>`)
  }

  // Attic: a gable on the ends the ridge runs between, a plain block on the sides.
  const ab = FLOOR_BASE_Y.attic
  if (view.axis === 'x') {
    const mid = W / 2
    out.push(
      `<polygon class="wall" points="0,${py(ab + ATTIC_KNEE_H)} ${mid},${py(ab + ATTIC_RIDGE_H)} ${W},${py(ab + ATTIC_KNEE_H)} ${W},${py(ab)} 0,${py(ab)}"/>`
    )
  } else {
    out.push(`<rect x="0" y="${py(ab + ATTIC_RIDGE_H)}" width="${W}" height="${(ATTIC_RIDGE_H) * PX}" class="wall"/>`)
  }

  // Storey lines.
  for (const f of ['ground', 'second', 'attic']) {
    out.push(`<line x1="0" y1="${py(FLOOR_BASE_Y[f])}" x2="${W}" y2="${py(FLOOR_BASE_Y[f])}" class="floor"/>`)
  }
  // Grade.
  out.push(`<line x1="-14" y1="${py(0)}" x2="${W + 14}" y2="${py(0)}" class="grade"/>`)

  // Openings.
  let count = 0
  for (const r of ROOMS) {
    if (r.floor === 'yard') continue
    const base = FLOOR_BASE_Y[r.floor]

    for (const w of r.windows || []) {
      if (w.side !== view.side) continue
      const sill = w.sill ?? WINDOW_SILL
      const head = w.head ?? WINDOW_HEAD
      const a = px(w.center - w.width / 2)
      const b = px(w.center + w.width / 2)
      const x = Math.min(a, b)
      out.push(
        `<rect x="${x}" y="${py(base + head)}" width="${Math.abs(b - a)}" height="${(head - sill) * PX}" class="win"/>`
      )
      count++
    }

    // The front door is the only exterior door, but drawing doors generally
    // keeps this honest if that ever changes.
    for (const d of r.doors || []) {
      if (d.side !== view.side) continue
      const plane =
        d.side === 'north' ? r.bounds.maxZ : d.side === 'south' ? r.bounds.minZ
        : d.side === 'east' ? r.bounds.maxX : r.bounds.minX
      const onEdge =
        (d.side === 'north' && Math.abs(plane - HOUSE_D) < 1e-6) ||
        (d.side === 'south' && Math.abs(plane) < 1e-6) ||
        (d.side === 'east' && Math.abs(plane - (X0 + HOUSE_W / 2)) < 1e-6) ||
        (d.side === 'west' && Math.abs(plane - (X0 - HOUSE_W / 2)) < 1e-6)
      if (!onEdge) continue
      const a = px(d.center - d.width / 2)
      const b = px(d.center + d.width / 2)
      out.push(
        `<rect x="${Math.min(a, b)}" y="${py(base + DOOR_H)}" width="${Math.abs(b - a)}" height="${DOOR_H * PX}" class="door"/>`
      )
    }
  }

  out.push(`<text x="0" y="${H + 26}" class="n">${count} window${count === 1 ? '' : 's'}</text>`)
  out.push('</g>')
  return { svg: out.join('\n'), w: W, h: H, count }
}

const cols = 2
const cellW = Math.max(HOUSE_W, HOUSE_D) * PX
const cellH = (HIGH - LOW) * PX

const parts = []
let total = 0
VIEWS.forEach((v, i) => {
  const ox = PAD + (i % cols) * (cellW + GAP)
  const oy = PAD + 40 + Math.floor(i / cols) * (cellH + GAP + 60)
  const d = drawView(v, ox, oy)
  total += d.count
  parts.push(d.svg)
})

const totalW = PAD * 2 + cols * cellW + (cols - 1) * GAP
const totalH = PAD * 2 + 40 + 2 * (cellH + GAP + 60)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
<style>
  rect,polygon,line{shape-rendering:crispEdges}
  .bg{fill:#0e1420}
  .wall{fill:#2a3242;stroke:#48546c;stroke-width:1}
  .below{fill:#0a0f18}
  .win{fill:#8fb4ee;stroke:#cfe0ff;stroke-width:1.5}
  .door{fill:#6b5330;stroke:#c9a86a;stroke-width:1.5}
  .floor{stroke:#48546c;stroke-width:1;stroke-dasharray:4 4}
  .grade{stroke:#7d8aa6;stroke-width:2}
  .t{fill:#cfe0ff;font:600 15px system-ui,sans-serif;letter-spacing:.08em}
  .n{fill:#8b97ad;font:12px system-ui,sans-serif}
  .h{fill:#e8eefc;font:600 20px system-ui,sans-serif;letter-spacing:.1em}
  .s{fill:#8b97ad;font:12px system-ui,sans-serif}
</style>
<rect class="bg" x="0" y="0" width="${totalW}" height="${totalH}"/>
<text class="h" x="${PAD}" y="${PAD}">THE STACK HOUSE — INTERIOR SHELL ELEVATIONS</text>
<text class="s" x="${PAD}" y="${PAD + 22}">${HOUSE_W.toFixed(1)} x ${HOUSE_D.toFixed(1)} m footprint · ${total} windows · dashed lines are storey levels · heavy line is grade</text>
${parts.join('\n')}
</svg>
`

const out = path.join(__dirname, '..', 'docs', 'elevations.svg')
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, svg)
console.log(`elevations.svg`.padEnd(26) + `${total} windows  ->  docs/`)
