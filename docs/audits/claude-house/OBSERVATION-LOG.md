# Claude house audit — observation log

_2026-09-06. Companion to `docs/CLAUDE_HOUSE_AUDIT.md`._

## Why there are no image files in this directory

Screenshots were taken and read during this audit, but **none could be written to
disk**. The in-app browser pane renders the r3f canvas without
`preserveDrawingBuffer`, so `canvas.toDataURL()` returns a blank frame
(verified — the encoded JPEG was a uniform black image), and the pane's own
screenshot channel returns images to the reviewing agent rather than to the
filesystem. Enabling `preserveDrawingBuffer` would have meant editing
`app/house/page.tsx`, which this audit was not permitted to do.

Instead, every visual claim in the report is reproducible from the exact camera
state below. Each row is a teleport that can be replayed from the browser
console on a running `/house`:

```js
window.__store.getState().requestTeleport({ position: [x, y, z], yaw, floor: 'yard' })
```

Yaw convention as observed: `yaw = 0` looks toward **-Z** (street / skyline);
`yaw = Math.PI` looks toward **+Z** (the house). `+X` is on the viewer's **left**
when facing the house, and is the driveway/garage side.

## Exterior camera states used

| # | position | yaw | What it shows |
| --- | --- | --- | --- |
| E1 | `[0, 1.7, -16]` | `Math.PI` | Whole front elevation: garage left, gabled entry porch, lit arched door, 4 upper windows, willow right |
| E2 | `[0.7, 1.7, -8]` | `Math.PI` | Entrance close-up: round arch, voussoir surround, two tall glazed lights over two lower panels, 3-step stoop, garage door |
| E3 | `[4.5, 1.7, -7]` | `Math.PI * 0.88` | Garage bay + entry porch in the same frame; upper window muntin grid |
| E4 | `[-6, 1.7, -9]` | `Math.PI * 1.15` | Three-quarter view: massing, roof, east elevation, willow, Touch-Grass sign |
| E5 | `[-11, 1.7, -11]` | `Math.PI * 1.25` | Wide three-quarter: roof character and overall silhouette |
| E6 | `[-8, 1.7, 3]` | `Math.PI * 1.72` | East elevation raking: segmental-headed ground windows, muntins, unlit glass |
| E7 | `[-9, 1.7, 4]` | `Math.PI * 1.55` | East elevation flat-on: window rhythm, wall/trim contrast |
| E8 | `[-8, 1.7, 4]` | `Math.PI` | Weeping willow close-up: canopy blades, trunk, absence of branch structure |
| E9 | `[0, 1.7, -14]` | `0` | Skyline plate as seen from the front walk |

## Exit-teleport reproduction (bug B1)

```js
window.__store.getState().requestTeleport({ position: [0.72, 1.7, -3.5], yaw: 0, floor: 'yard' })
// let one frame render, then:
window.__pos   // -> { x: 0.72, y: 1.7, z: -4.791, location: 'yard' }
```

Observed on a live page. `z` moves 1.291 m on the first simulated frame because
`YARD_EXIT_POINT` is inside the `house` AABB in `lib/colliders.ts`.

## Interior camera states used (v002 walkthrough, 2026-09-06)

Run against `http://127.0.0.1:3017/house?architecture=v002&controls=desktop`.

**`requestTeleport`'s `floor` does not change floor identity** — it moves the
camera, but `currentLocation` stays put and the vertical resolver snaps you back
to the old storey. Call `setCurrentLocation` first. This helper does both:

```js
window.__go = (f, x, z, yaw) => {
  const st = window.__store.getState()
  st.setCurrentLocation(f)
  st.requestTeleport({
    position: [x, ({basement:-3.2, ground:0, second:3.2, attic:6.4})[f] + 1.62, z],
    yaw, floor: f,
  })
}
```

Yaw: `0` → −Z, `Math.PI` → +Z, `-Math.PI/2` → +X, `Math.PI/2` → −X.

| # | call | What it shows |
| --- | --- | --- |
| I1 | `__go('ground', 300, 0.65, Math.PI)` | Real arrival view — stair ahead, doorway either side |
| I2 | `__go('ground', 300, 1.6, 0)` | Front door from inside: arch, ivory casing, brass lever/deadbolt/hinges, sconce. Low casing-to-wall contrast (§2.3) |
| I3 | `__go('ground', 300, 3.2, 0)` | Whole foyer south wall — the view that made me withdraw W1(b) |
| I4 | `__go('ground', 300.6, 1.4, -Math.PI/2)` | Client Room from the foyer door. **Panelling reads as a flat stripe; band stops at the corner (W3)** |
| I5 | `__go('ground', 303.8, 4.2, 0)` | Client Room straight on. Two square windows, cornice, dado terminating |
| I6 | `__go('ground', 302.4, 1.6, 0)` | **Window straight on — casing measures 358 × 357 px, 1.00:1 (P2)** |
| I7 | `__go('ground', 300, 2.0, Math.PI)` | Lower flight. **Balusters appear absent here — newel and string hide them** |
| I8 | `__go('ground', 301.0, 2.2, Math.PI*1.15)` | Same flight raking — balusters clearly present. Clears the false bug |
| I9 | `__go('second', 300.9, 3.6, Math.PI*0.75)` | On the flight: balusters, oak rail, raking soffit |
| I10 | `__go('second', 296, 3.5, 0)` | Library / Study — bare shell, square window, blank wall |
| I11 | `__go('second', 296.5, 4.6, Math.PI*0.25)` | **Light streaks across the floor (P1)** |
| I12 | `__go('second', 295.0, 2.0, Math.PI*0.6)` | Window joinery close up + specular blob on the glass |
| I13 | `__go('attic', 300, 3.0, Math.PI)` | Attic: rafters, collar ties, gable window, stairwell guards |
| I14 | `__go('attic', 300, 1.9, Math.PI)` | Attic guards at the opening edge |
| I15 | `__go('basement', 296, 4.0, 0)` | Basement landing — bare, very low wall/floor value separation |

### P1 streak diagnosis — the four cases that settle it

| # | call | Result |
| --- | --- | --- |
| S1 | `__go('second', 297.2, 5.1, 0)` | Library from the NE corner — striped patch on the floor over the ground-floor wall line at x ≈ 295.1 |
| S2 | `__go('second', 297.8, 2.9, Math.PI/2)` | Square to the **west** window — bands are on the floor but **not** under the opening |
| S3 | `__go('second', 296.2, 4.6, 0)` | Square to the **south** window — same, not aligned with the opening |
| S4 | `__go('second', 300, 8.9, 0)` | **Storage — no partition below in view, no streaks.** The control |
| S5 | `__go('ground', 296.0, 8.5, 0)` | **Kitchen — the basement below is one undivided room, no streaks.** Second control |
| S6 | `__go('attic', 297.0, 7.5, 0)` | Attic floor — banding present over the second-floor walls |

Coplanar-face arithmetic behind it, from the GLB bounds:

```
interior-ground-v002.glb   local Y −0.120 → 3.200,  mounted 0.0   →  world −0.12 → 3.20
interior-second-v002.glb   local Y −0.120 → 3.200,  mounted 3.2   →  world  3.08 → 6.40
                                   ground wall tops = 3.200
                                second floor slab top = 3.200      ← coincident
```

Same at basement→ground (0.00) and second→attic (6.40).

### Exterior roof (§2.4b)

| # | call | What it shows |
| --- | --- | --- |
| E10 | `[0, 1.7, -15]`, yaw `Math.PI` | Front elevation with post on — horizontal eave, entry pediment, no gable end |
| E11 | `[-12, 1.7, -1]`, yaw `-Math.PI/2` | East elevation square on — horizontal eave and fascia, no gable, storey band, segmental heads on the ground floor only |
| E12 | `[-13, 1.7, -13]`, yaw `Math.PI*1.28` | Three-quarter — overall roof mass |

### Exit bug (P3) reproduced end-to-end on v002

```js
const st = window.__store.getState()
st.setCurrentLocation('ground')
st.requestTeleport({ position: [300, 1.62, 0.65], yaw: Math.PI, floor: 'ground' })
st.exitToYard()
// render one frame, then:
window.__pos   // -> { x: 0.72, y: 1.7, z: -4.791, location: 'yard' }
```

Declared `YARD_EXIT_POINT` z is `-3.5`. Observed `-4.791`.

## Which build the EXTERIOR observations came from

Port **3017 was not listening** during this audit. The only Stack House server
running was port **3001**, serving
`~/.codex/.chatgpt-projects/.../stackhouse-portfolio` at commit `5c47c0a` — the
merge base, with none of the v002 interior work.

`git diff --stat 5c47c0a HEAD` was used to confirm that every yard component
(`house-model`, `willow-tree-model`, `skyline-plate`, `sky-dome`, `yard-ground`,
`curb-and-sidewalk`, `perimeter-fence`, `front-door`), the exterior GLB, the yard
colliders and `YARD_EXIT_POINT` are **byte-identical** between that commit and
`HEAD`, and that the yard camera is 1.7 m / 75° in both. The exterior
observations above are therefore representative of HEAD.

The **v002 interior was walked separately**, after the user authorised starting
a server — `npx next dev -p 3017` against this checkout. Those camera states are
the I-series above, and the exterior E-series remains valid because the yard is
byte-identical between the two trees.
