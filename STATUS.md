# Stack House — Status

_Last updated: 2026-10-01 (LOCAL interactive verification pass — see "Local verification pass" at the end; it closes most of the cloud handoff above it)_

**Canonical design alignment:** Read and incorporated the new experience bible
and `AGENTS.md`. The entrance pass is architectural, not the locked arrival
gameplay. The current night/free-roam preview does not yet implement the bible's
daytime arrival, initially locked front door, or outdoor tutorial puzzle. Keep
those requirements for the gameplay phase; current geometry and traversal remain
stable. Future room work must use Library/Study, Writing Room/Sunroom, and Master
Bedroom/Merch identities from the bible despite older code labels.

**Foyer entrance:** Added a Blender-authored blue panelled door, ivory frame,
brass hardware and matching closed-door collision. Live USE exit/re-entry and
architecture/TypeScript checks pass. Plain `/house` now defaults to the approved
v002 shell on this branch; `architecture=legacy` preserves the old shell view.

**Stairwell correction:** Removed the projecting slab strip between flights in
v002. Floor/ceiling cuts now include the centre gap as one continuous opening.
Regression raycasts and all six stair traversals pass.

**Shell v002:** Foyer/client room now has Blender-authored oak flooring, blue
panelling, detailed door trim and wall fixtures. Attic guards have matching,
height-aware collision. Preview `/house?architecture=v002&controls=desktop`
on port 3017; `controls=touch` works in the in-app browser. TypeScript, six
simulated stair traversals, four guard checks and a live client/foyer doorway
crossing pass. See `docs/ARCHITECTURE_V002.md` for source assets and limitations.
The shell remains unfurnished; no production deployment was made.

**Codex rebuild setup:** The read-only 3D audit has been reviewed. The user has
approved a substantial photoreal-leaning `/house` overhaul, starting with the
foyer/stair hall/client room, while retaining the house identity and nighttime
palette. See `docs/3D_REBUILD_BRIEF.md` for the approved scope, audit follow-ups,
and browser observations. Claude's shell work is preserved in recovery commit
`47bb3ba` on `codex/house-photoreal-v1`, pushed to GitHub. The local server is
available at `http://127.0.0.1:3017`. The first Blender-authored staircase candidate
is available at `/house?architecture=v001&controls=desktop`. It includes detailed
treads/risers/railings and smooth soffits, candidate slab/winding fixes, and an
interior shadow-camera correction. Geometry checks, six simulated stair traversals,
and TypeScript pass; desktop/touch visual inspections completed. See
`docs/ARCHITECTURE_V001.md` for reproducible sources and remaining shell work.
Furniture remains deferred until the shell is believable.

Living state-of-the-project file. Update at the end of every session.

---

## Where things stand

**The exterior/yard is the mature half.** `/house` renders a night-time yard —
Meshy-derived house, willow, fence, bushes, grass, curb/sidewalk, street lamps,
neighbour street, skyline plate, sky dome, stars. FPS controls on desktop,
joystick + drag-look on mobile. Boot sequence, HUD, proximity prompts, front
door → interior transition all working.

**The interior is the v002 shell, mostly furnished.** Four floors, 22 stable
room ids, plan-derived collision, working vertical movement. Plain `/house`
shows v002 (Blender-authored shell details, floor finishes, staircase-v002 and
per-room furniture GLBs with matching collision); `?architecture=legacy` shows
the procedural shell. Ground floor, upstairs bathroom/office/master suite/
closet/guest room, basement arcade, mechanical and laundry are furnished; Grey
Key Studios, the Library/Study/Writing room and the Archive are not. The
2026-09-08 entries below are the current detail; the sections immediately
following describe the shell phase and are kept as history.

---

## Interior: what exists

| Piece | State |
| --- | --- |
| Floor plan | Done — `lib/interior-layout.ts`, single source of truth (22 rooms, 4 floors, PLAN_SCALE 1.0) |
| Geometry | Generated — `npm run build:interior` emits the 4 floor GLBs from the plan |
| Collision | Derived from the same plan, so geometry and colliders can't desync |
| Stairs | Switchback core, modelled into the GLB of the floor *below* |
| Lighting | Per-room fills derived from `ROOMS` centres + `ROOM_TINT` identity colours |
| Windows | 28 openings (5 basement / 10 ground / 11 second / 2 attic gable) — see docs/elevations.svg |
| Rooms furnished | Superseded — see the 2026-09-07…09 furnishing entries; v002 furniture lives in `public/models/*-furniture-v002.glb` with collision from `lib/*-furniture-v002.json` |
| Everything else | `DoorPlaceholder` markers, now DERIVED from unfurnished rooms + `ProxyFurniture` scale boxes |

Interior GLBs are 51–299 KB each — pure procedural geometry, no textures, no
props. That number is the honest measure of how much room there is to grow.

### Load-bearing constraints (do not relearn these the hard way)

- **X0 = 300.** Interior lives 300 units off in world space; the yard play
  area is `getWorldBounds('yard')` in `lib/use-player-vertical.ts`, currently
  x∈[-16,16] (the old [-25,25] clamp in fps-controls no longer exists).
  `scripts/validate-layout.cjs` fails if the two areas ever touch. Both scenes stay mounted, visibility-toggled — no
  mount/unmount on teleport, so no pop-in.
- **Fixed light pool of 8** (7 until 2026-10-01). `POOL_SIZE` in
  `app/house/page.tsx`. Changing the *number* of visible lights recompiles every
  material in the scene (measured: 666 ms, and up to 1.9 s with the house
  furnished). Never mount, unmount, or `visible={false}` a light — and a light
  inside the yard group or a floor group IS hidden whenever that group is.
  Component lights (lamps, glows) register with `usePoolLight`
  (`lib/light-pool.ts`) instead of mounting a `<pointLight>`. The count is 11
  everywhere; check with `/house?stats` and `window.__three`.
- **No glTF transmission.** A visible transmissive material re-renders every
  opaque object into a second target. `stripTransmission` runs on every
  interior asset (`lib/interior-materials.ts`); one shower screen had halved the
  interior frame rate.
- **The interior is warmed under the boot overlay** (`WarmInterior` in
  `app/house/page.tsx`): drawn once, culling off, then hidden again. This only
  works because the interior holds no lights; it is what turned a 4-5 s freeze
  at the front door into one normal frame.
- **Movement is sub-stepped** (`lib/player-movement.ts`, max 4 cm). Stair floor
  handoffs need a step to land in a 5 cm band; at low frame rates single steps
  jumped it and wedged the player at every flight end.
- **Tailwind runs without Preflight.** `postcss.config.mjs` was EMPTY until
  2026-10-01, so no utility class ever applied (the Home Office overlay rendered
  off-screen). The gate/portfolio CSS assumes browser defaults, so Preflight
  stays off; give overlay `<button>`s `color/font: inherit` explicitly.
- **Neighbour floors stay visible.** Culling to the active floor alone shows a
  void down the stairwell.
- **Post-processing is desktop only.** N8AO (low/halfRes) + Bloom + ACES +
  Vignette, `enableNormalPass={false}`. Every setting there was chosen to hold
  60 fps; the comments record what was tried and cut.
- **`isMobile` gates BOTH the control scheme and post-processing**, so getting
  that detection wrong silently changes how the whole scene looks, not just how
  it is driven. It was wrong until 2026-09-04: the check treated
  `maxTouchPoints > 2` as proof of a phone, and Windows reports 10 touch points
  for any touchscreen or precision touchpad — so every touch-capable Windows
  desktop got the joystick UI, no WASD, and a flat un-tone-mapped render. It now
  decides on INPUT (`any-pointer: fine` / `any-hover: hover`), not on how many
  fingers the screen can track. `?controls=desktop` and `?controls=touch`
  override it, because being stuck in the wrong scheme is unrecoverable from
  inside the page.
- **Deploy is Cloudflare Pages, static export.** Asset weight is a hard budget,
  not a nice-to-have.
- **Render resolution is capped** on the house Canvas: dpr 1.5 from 2026-09-04,
  lowered to **dpr 1** on 2026-09-08 for stair traversal (see Home office entry).
  It was unset, and r3f defaults to [1, 2] — so a devicePixelRatio-2 display
  rendered 4x the pixels, post passes included. The gate scene had always
  clamped; this one never did. `powerPreference: high-performance` added at the
  same time so laptops stop using the integrated GPU.
- **`/house?stats`** shows frame timing, draw calls, triangles and the real
  backing-store size, and exposes `window.__three` (`gl`, `scene`, `camera`) for
  profiling scripts. Measured 2026-09-04: interior 78 draw calls / 10.3k tris,
  yard 65 calls / 614k tris. The interior is geometrically trivial — anything
  slow in there is fill rate or CPU, never scene complexity. The yard is the
  heavy scene, and the 2048 shadow map re-renders all 614k every frame.

---

## Current work front: make the shell feel like a house

Textures and props are **not** the current task. The job right now is getting the
*shell* right — the thing you walk through before anything is decorated. A space
reads as a house or doesn't based on proportion, openings, and sightlines, and
that has to land before any surface work is worth doing.

Agreed build order: **trim → windows → attic → textures → props.**

### Shell: done

- Door openings cut by the same algorithm the colliders use, so a doorway you
  can walk through is a doorway you can see.
- Door **headers** — openings stop at 2.05 with wall above. A floor-to-ceiling
  gap reads as a missing wall panel, not a doorway, and fixing that was a large
  part of why the blockout started reading as rooms.
- Door **casings** (0.09 face width), **thresholds**, and **baseboards**.
- Walls run full floor-to-floor, not just to the ceiling — no 0.4 gap to the
  storey above.
- Ceiling at 3.0 (2.8 is residentially correct but read as low), decoupled from
  the joist cavity so it can move freely.
- Attic gets a **roof** instead of a ceiling slab.
- Stairwell openings punched through floor and ceiling slabs.
- **Windows** — 28 openings (2026-09-04). See below.

### Shell: windows

`WindowDef` on `RoomDef`, cut by the generator the same way doors are. Details
worth not rediscovering:

- **Windows are a separate list from `doors` on purpose.** Collision reads
  `doors` and nothing else, so a window can never become walkable by accident.
  And a window is only ever owned by ONE room, so it has no equivalent of the
  door-matching rule — `assertExterior` makes an interior-wall window a build
  error instead.
- **Reveals come free.** The wall is cut full-height by `solidSegments`, then
  the sill and head panels are put back. The neighbouring wall segments' own
  faces *are* the jamb reveal, so the opening is a real hole through 0.2 m of
  wall rather than a decal.
- **The baseboard is cut by doors only** — it runs underneath a window.
- **Sill heights vary by purpose**: 0.9/2.1 default, 2.25/2.75 in the basement
  (below grade, so they read as window wells hard under the ceiling), 1.45 sill
  for the bathroom and half-bath.
- **The attic is a special case.** Its room bounds are inset to the knee walls,
  and the knee is 1.15 — too low for a window. Its two openings are GABLE
  windows, cut out of the triangle with a Sutherland-Hodgman clip (`clipRect`).
  East/west windows there are rejected outright.
- **The glass is opaque, and that is deliberate.** There is nothing outside the
  interior scene — it lives alone at X0=300. So the pane is a dark, faintly
  emissive panel in the yard's fog colour, which is what a window looks like
  from a lit room at night. Emissive, not lit: a window needing its own light
  source would cost one of the seven pool slots.

Still open on windows, both small:

- **No transom or sidelights over the front door.** The Foyer is 2.3 m wide with
  a 1.2 m door and its casings in the middle of that wall — there is no honest
  room either side, and a transom needs the generator to cut the door HEADER,
  which it does not do yet.
- **The panes are flat colour.** A vertical gradient (darker at the sill) would
  do a lot, and wants vertex colours or a texture — so it belongs with the
  surface pass, not here.

### Shell: room sizing (changed 2026-09-04)

**`PLAN_SCALE` went 1.15 → 1.0.** The rooms were not cramped, they were huge —
the two earlier increases compounded to 1.38x, which is 1.9x the AREA of the
original plan, and most rooms already met the reference sheet before any of it.

|  | at 1.15 | at 1.0 | real-world |
| --- | --- | --- | --- |
| Per floor | 189 m² (2029 sqft) | **143 m² (1535 sqft)** | — |
| Living / office / gallery | 41.1 m² | **29.4 m²** | 20–30 |
| Kitchen + dining | 56.2 m² | **42.5 m²** | 20–30 |
| Archive (attic) | 133.9 m² | **95.0 m²** | — |
| Grey Key Studios | 82.1 m² | **58.9 m²** | sheet says 35.8 |

Why this matters for the photoreal goal: empty floor is the clearest tell that a
room is a set, and arch-viz spaces read as real because they are DENSE. A 41 m²
room needs roughly three times the props of a 22 m² one. With 21 rooms still
unfurnished, size multiplies the remaining work rather than improving the look.

Two existing problems improved for free, because both were the oversizing
surfacing somewhere else:

- **Lighting.** One decay-2 fill now covers a room; at 1.15 the comments in
  `page.tsx` record rooms over 60 m² needing two, and the Archive being "lit to
  the point of being unreadable".
- **Window proportion.** Window widths are human-scale and deliberately do NOT
  scale with the plan, so the same openings now read correctly against the wall
  instead of leaving broad bands of blank plaster between them.

**Do not raise it again** without a reason that is not "rooms feel small in
first person" — that is usually the 75° FOV in `app/house/page.tsx` talking, and
it is also why the ceiling got raised 2.8 → 3.0. Fix the camera before the
architecture. Going below 1.0 gets risky: `CORE_WIDTH` is a fixed 2.3 and does
not scale, so the columns either side of the stair absorb every reduction and
circulation has already failed here once.

### Shell: service rooms + window cull (2026-09-04)

Second pass after walking the whole house. Two problems, both now fixed.

**Service rooms were sized like bedrooms**, because the plan divides a grid
rather than sizing by function. `PLAN_SCALE` could not touch these — they are
wrong in proportion, not scale.

| Room | Was | Now |
| --- | --- | --- |
| Linen | 14.0 m² | **3.2** — moved out of the east column into the tail of the core |
| Bathroom | 15.4 m² | **10.0** — re-cut long and narrow (1.85 x 5.4), the shape a real bath takes |
| Pantry | 10.8 m² | **4.6** |
| Upstairs storage | 10.8 m² | **7.6** |
| Half-bath | 7.3 m² | **5.1** — 1.7 wide, the 0.75 goes to the Mudroom |

Two rooms are NEW, because shrinking service rooms leaves area that has to go
somewhere — every storey's rooms must tile its floor plate exactly or the floor
has holes in it:

- **Laundry** (6.2 m²), ground, in the core column behind the Pantry.
- **Guest Room** (19.4 m²), second, in the east column the Bathroom and Linen
  vacated. This is the one genuinely new IDEA rather than a resize — the house
  had no bedroom at all. Rename it if it should carry portfolio content.

Grey Key Studios stays oversized at 58.9 m² against the sheet's 35.8, by
decision: it is the room allowed to be a fantasy.

**Windows went 37 → 28.** The first pass was authored per room, from inside, and
judged nothing at the elevation level — so every room got two or three openings,
including the pantry and the linen closet. Now:

- Service rooms have none: pantry, laundry, storage, linen, foyer, basement
  stair hall.
- Corner rooms get a pair on the long elevation and ONE on the return, not two.
- The south and east elevations are vertically STACKED — the Home Office pair
  sits directly above the Client Room pair, the stair window directly above the
  front door. Aligned openings are most of what makes a facade read as designed.
- Max per room is 3 (kitchen, client room, home office — all corner rooms).

**`npm run elevations` draws all four elevations to `docs/elevations.svg`.**
This view did not exist before, and its absence is why the over-glazing was
invisible: window placement is authored per room from inside, but judged per
elevation from outside — and you cannot get outside. The interior scene lives
alone at X0=300 with light only inside its rooms, so pointing the camera at the
shell renders black. Check the drawing after any window change.

### Two validators worth keeping

Both are now automated in `scripts/validate-layout.cjs` (`npm run validate`,
run in CI), and both caught real breakage during the re-cut:

- **Door pairing.** Every interior door must have a matching entry on the room
  the other side; the front door is the only legitimate unmatched one.
- **Floor plate coverage.** Each storey's rooms must sum to exactly the footprint
  area. Under-tiling means holes in the floor, over-tiling means z-fighting.

### FOV — the open question

75° is wide. Arch-viz walkthroughs sit at 50–60. An A/B at 60 from the same spot
made rooms read noticeably more like photographs — less edge distortion, windows
at their true size — at the cost of peripheral vision while walking. **Resolved 2026-09-06:** interior 65° at 1.62 m eye height,
yard stays 75° / 1.7 m (`lib/player-camera.ts`; see Camera proportion review).

It interacts with two things already decided: the ceiling went 2.8 → 3.0 because
it "read as low", which is the wide FOV talking, and rooms feeling cramped at a
smaller `PLAN_SCALE` would be the same effect. Change FOV first, re-judge both
after.

### Shell: what's next

The attic pass. The roof volume, rafters, collar ties and gable windows exist;
the space under them is still undressed, and the eave strip is unreachable by
design (`eaveInset`) but reads as a bug without clutter along the line.

Then surfaces.

---

## Where this is heading (direction set 2026-09-04)

**The interior is aiming at photoreal, not stylised.** This changes the
*destination*, not the current task — the shell still comes first.

Previously the accepted bar was "Meshy-quality / bad N64," on the reasoning that
the experience carries the project rather than the graphics. That still holds
for the *exterior*. For the interior the goal is now genuine visual impact — the
reference is an architectural-viz walkthrough. This isn't really a reversal:
what got rejected before was *flat/low-poly*, and Meshy was accepted precisely
because it was photoreal-ish.

Why it's reachable rather than a rewrite:

- The interior is a **separate scene** from the exterior. It can look better
  than the yard without any reconciliation problem, and nothing about the
  exterior GLB constrains it.
- `scripts/build-interior.cjs` already emits **world-space UVs** and named
  material groups (`floor`, `wall`, `ceiling`, `stair`, `trim`, `glass`) at 1 repeat per
  world unit. Tiling PBR materials can be swapped in per material name later
  without touching a single vertex.
- The lighting model is already physical — decay 2, per-room fills, ACES,
  contact AO. The comments call this "setting up the lighting strategy the props
  will rely on later," which is exactly what photoreal needs.

Once the shell is done, ranked surface work:

1. PBR materials on the six generated material groups (KTX2-compressed).
2. Baked lighting from Blender/Cycles into lightmaps — the real photoreal lever,
   and it sidesteps the 7-light ceiling entirely, since bounce costs nothing at
   runtime once baked.
3. Custom interior HDRI replacing `<Environment preset="night" />` for
   reflections.
4. Props per room, Meshy-generated, through the existing Blender optimisation
   recipe.

### Open risks

- **Asset budget.** Texturing + lightmapping 4 floors can add tens of MB if done
  carelessly. KTX2/Basis + atlasing from the start, not as a cleanup pass.
- **Mobile tier.** Post is already off there; a photoreal interior needs an
  explicit reduced tier rather than shipping the same assets.
- **Exterior/interior gap widens.** Walking through the front door will jar
  more, not less. Either raise the exterior later or lean into the transition
  deliberately.

---

## Known temporary things

- `MainTerminal` removed from the yard (proximity zone overlapped `FrontDoor`,
  plus its own unresolved "gets stuck" bug). Re-add during a dedicated pass —
  the call site is commented in place in `app/house/page.tsx`.
- `window.__store` debug hook still exposed in `app/house/page.tsx`, left in
  while diagnosing the stair-warp report.
- `ProxyFurniture` is scale reference only.
- `package.json` still names the project `portfolio` (renamed to `stackhouse`
  2026-08-13).

---

## Commands

```bash
npm run dev              # Next dev server
npm run build:interior   # regenerate the 4 interior floor GLBs from the plan
npm run elevations       # redraw docs/elevations.svg — check after any window change
npm run build            # static export
npm run typecheck        # the build skips type errors (ignoreBuildErrors) — this does not
npm run validate         # plan, portfolio-truth and render/deploy invariant validators
npm run validate:static  # after build: routes, links, asset refs, 25 MiB limit, weight
npm run check:generated  # regenerated shells + elevations must equal what is committed
npm run check:architecture  # GLB geometry, stair traversal, routes, Blender provenance
npm run check            # typecheck + lint + validate
```

`.github/workflows/validate.yml` runs all of these on pull requests.

### Entrance shape correction — 2026-09-05
Interior entry-door-v002 now follows the exterior rounded arch, two tall glazed panes and two lower panels. Removed conflicting square entrance trim from v002. Blender source and manifest saved; TypeScript and architecture regression checks pass. Shell-first work continues; no furniture added.


### Stair joinery follow-up — 2026-09-06
The v002 preview now uses staircase-v002: closer balusters seated on each tread and a connected half-landing handrail. Stair dimensions and collisions are unchanged; original v001 is retained. Blender source saved, architecture regression checks and TypeScript pass. Shell remains the active work front.


### Window construction follow-up — 2026-09-06
Added recessed sash frames, meeting rails, painted lifts and jamb liners throughout the v002 shell. Reduced blue glass emission for the current night preview. Window geometry and traversal regressions pass; client-room appearance verified in browser. Exterior views remain unfinished; no furniture added.


### Foyer arrival correction — 2026-09-06
Moved entry from z=2.4 to z=0.65, just inside the front door, and explicitly face into the foyer. Exit now requires looking back at the door; its target is z=0.35. Live arrival has no exit prompt; turning back reveals Exit to Yard. Architectural dimensions are unchanged. Stair manifest layout hashes refreshed for the navigation-only layout edit.


### Camera proportion review — 2026-09-06
Interior camera now uses 1.62m eye height and 65-degree vertical FOV (previously 1.7m / 75). Yard camera remains unchanged. Entry and stair resolver share the new eye height; all six stair traversal checks pass. Navy panelling, trim and room geometry are unchanged pending user review.


### Resume checkpoint — user feedback
User reports the 1.62m / 65-degree camera is vastly better, with a slight remaining sense of odd scale. Keep this as the current baseline; do not enlarge rooms or change trim to compensate. The earlier hospital-like trim concern referred specifically to the navy lower-wall panelling; the actual ivory trim is approved. Next: review the living room at desktop aspect ratio and discuss the navy panelling before altering it. Furnishing remains deferred. No background work is scheduled during the usage pause.


### Audit bug fixes
Confirmed v002 wall tops coincided with the next floor surface. Generator now buries tops 6cm into the 12cm slab; regression failed before and passes after. Yard exit moved to z=-5.1, clear of the house collider; zero-input movement no longer pushes the spawn. Room geometry, camera, panelling and window proportions otherwise unchanged.


### Living-room proportion and panelling pass — 2026-09-07
User delegated design choice. Raised default window heads to 2.4m while preserving sills, widths and centres; regenerated v002 shells and elevations. Navy panelling now runs around all living-room walls, stops clear of door casings, and uses narrower panels with 8mm fields behind 35mm frames and a navy stepped cap below the window sill. Camera and ivory trim preserved. Desktop room view verified before the usage pause; window/stair/collision regressions and TypeScript passed.


### Stair oak material pass — 2026-09-07
V002 stair treads, posts and handrails now share the authored oak grain used by the foyer floor, aligned along each timber, with a satin roughness of 0.47. Texture embedded in the GLB and packed in the Blender source. Geometry remains 14,540 triangles / three material primitives. Live desktop close-up and all six stair traversal regressions passed. Preview runs on port 3017; furnishing remains deferred.


### Living-room furnishing foundation — 2026-09-07
User approved moving from shell work into furnishing using the restrained room concept as direction. Added an oatmeal sofa, tobacco armchair, oak coffee table, rug, media cabinet/TV and closed client laptop to v002. Blender source and shared placement JSON saved: 8,084 triangles, seven material primitives, 682,840 bytes. Desktop views checked from both ends; room route, furniture collision activation/cleanup and six stair routes pass. TV/laptop remain visual props pending portfolio interactions. Next: upholstery/rug surface detail, practical lamps and personal touches; preserve clear foyer-to-game-room route.


### Living-room material and reading-corner pass — 2026-09-07
Added authored embedded linen/rug textures, a brass reading lamp with a warm light in the existing fixed light pool, and a notebook/coffee cup. Lamp geometry and collision share its placement entry. Updated furniture export is 9,080 triangles, 11 material primitives and 1,181,444 bytes. Live desktop views, TypeScript, five furniture colliders, doorway route and six stair traversals pass. TV/laptop interactions remain pending; current laptop is still a closed visual placeholder for the locked browser-session experience.


### Whole-floor finishes — 2026-09-07
User approved wood on the first floor except kitchen/bathroom and carpet on the second. V002 now extends smoked oak into mudroom, pantry, laundry and the room with stable id `game-room` (now Dining Room); existing foyer/living oak stays. Kitchen, half bath and upstairs bathroom use warm porcelain tile; remaining upstairs rooms and landing use warm low-pile carpet. Stairs remain oak. Floor finish surfaces clear the original doorway thresholds by 2mm; movement geometry and shaft openings stay unchanged. Finishes are generated from the authoritative room plan. Existing basement/attic treatment preserved.

Validation: room-by-room floor material/height checks, shaft-clearance checks, furniture routes, six stair routes and TypeScript pass. Kitchen threshold flicker fixed and visually rechecked. Ground finish adds 500 triangles; second floor adds 16.

### Dining room and basement game room — 2026-09-08

User moved the Game Room / Man Cave from the first-floor room beside the living room into the large basement landing. The first-floor room is now the Dining Room, the kitchen retains a smaller breakfast area, and a new opening through the pantry creates a direct Kitchen -> Pantry -> Dining service route. Stable room ids remain unchanged for saved-state and integration compatibility.

### Dining room furnishing — 2026-09-08

Added a six-seat smoked-oak dining table, warm upholstered chairs, muted rug, navy-fronted sideboard, table settings, restrained wall art, and a compact chandelier. The east-west table orientation keeps both the living-room entrance and the Kitchen -> Pantry -> Dining service route clear. V002 mounts matching furniture collision; legacy variants remain unaffected.

### Kitchen furnishing — 2026-09-08

User review established that the first versions read too ordinary and fragmented for the house. The final initial pass uses continuous warm-ivory and stone perimeter cabinetry: both west-wall runs meet the statement range and the north run turns cleanly into the sink counter. The smoked-oak and stone island is centered in the full room, and the wide four-door smart refrigerator moved east along the south wall so it no longer crowds the cabinet corner. Its approved integrated terminal screen and accumulated personal notes remain; `STACK_HOUSE_WORK_DISPLAY.md` records the explicit refinement to the locked kitchen surface. The physical in-progress cookbook remains on the island.

The breakfast table and chairs were removed by explicit user direction because the adjoining Dining Room already handles eating. This gives the Kitchen enough open floor to support the centered island and makes the Mudroom entrance plus the Pantry and Laundry service routes clearer. Matching v002 collision follows the revised six-piece layout.

Walkthrough review showed the first centered island still read as a long commercial prep counter. Shortened it from 2.60 m to 2.05 m, deepened it from 1.04 m to 1.22 m, and placed it on the Kitchen's actual plan center. It remains intentionally rectangular while reading more like a balanced residential statement island. Pendants and cookbook placement moved with the revised footprint.

### Pantry furnishing — 2026-09-08

Added full-height smoked-oak shelving to both long walls of the walk-through Pantry, with labeled lower bins, dry-goods jars, preserves and upper baskets. Storage stays shallow enough to preserve a clear central Kitchen -> Pantry -> Dining aisle. Matching v002 collision is mounted only with the candidate architecture; the Blender source, shared placement JSON and export manifest are retained with the other furnishing assets.

### Laundry furnishing — 2026-09-08

Added side-by-side front-loading washer and dryer units, a warm-stone utility sink and cabinet, practical shelving, folded towels, laundry supplies and an opal ceiling fixture. The appliances occupy the east wall and the utility counter stays against the north wall, preserving a clear route from the Kitchen door into the working aisle. Matching v002 collision is mounted only with the candidate architecture and follows the shared placement data.

### Mudroom furnishing — 2026-09-08

Added a navy and smoked-oak built-in west of the Kitchen opening with a cushioned bench, shoe cubbies, boot tray, paneled coat wall, hooks, hanging coats and upper cabinets. An umbrella stand occupies the unused southwest corner. The direct Foyer -> Mudroom -> Half Bath route and the turn north into the Kitchen remain open and visually legible. Matching v002 collision follows the shared placement data.

### Half Bath furnishing — 2026-09-08

Completed the ground-floor powder room with a navy furniture-style vanity, warm-stone top, vessel sink, brass fittings, framed round mirror, paired sconces, residential toilet, towel ring and paper holder. The vanity and toilet occupy opposite ends of the narrow room so the Mudroom doorway opens into a clear center aisle. Matching v002 collision follows the shared placement data. This completes the initial ground-floor furnishing pass.

### Upstairs bathroom furnishing — 2026-09-08

Started the second-floor pass with the full Bathroom. The long, narrow room now has a navy vanity and mirror near the hall entrance, a west-facing toilet farther in, and an alcove tub/shower beneath the high north window with a partial glass screen. Brass fixtures, towels and a runner supply residential scale. The fixtures stay on the perimeter and preserve a continuous hall-to-tub aisle. Matching v002 collision mounts only on the candidate second floor and follows the shared placement data.

### Upstairs storage furnishing — 2026-09-08

Added blackened-steel and plywood perimeter racks, mixed labeled household bins, seasonal floor boxes and a small clue-ready lockbox. The deep rack stays against the east wall, the north rack turns the storage around the back corner, and the loose box stack occupies dead floor away from the west doorway. The center remains open for believable access to the stored items. Matching v002 collision follows the shared placement data.

### Linen closet furnishing — 2026-09-08

The compact, windowless upstairs Linen room now reads as a finished household service closet. A warm painted linen press spans the back wall with lower cupboards, open oak shelves and ordered stacks of white, oatmeal and navy linens. Shallow east-wall shelving holds woven baskets, with a floor hamper and compact warm ceiling fixture completing the room. Furnishing remains tight to the back and east walls so the west doorway and central standing space stay clear. Matching v002 collision follows the shared placement data; the room remains intentionally mundane and carries no forced portfolio display.

### Home office furnishing pass — 2026-09-08

Rebuilt the upstairs Home Office after confirming that its desk, computer and full-height reference cabinet were disposable placeholders. The v002 room now uses one coherent asset: a smoked-walnut executive desk facing the entrance, dual displays, a proper task chair and lamp, the approved printer on a fitted credenza, and a low reference console that keeps the room visually open. The existing Home Office interaction remains attached to the new workstation while its legacy model is hidden in v002. Matching collision covers the desk, credenza and low console, and all three doorway routes remain clear.

The house Canvas now renders at one device pixel per CSS pixel. The former 1.5 ceiling multiplied every full-screen post-processing pass by 2.25 precisely in the stairwell, where three furnished floors can be visible together. This prioritizes smooth stair traversal while retaining the existing AO, lighting and material treatment.

### Master bedroom / merch furnishing — 2026-09-08

Furnished the stable `guest-room` geometry as the canonically approved Master Bedroom / Grey Key Merch room. The bedroom-first layout uses a smoked-oak bed with upholstered navy headboard, paired nightstands and lamps, a dresser, partly open wardrobe, full-length mirror, hat, weekender bag and window-conscious placement. Grey Key merch appears naturally on the comforter, a framed wall print, folded shirts and hanging apparel rather than as a storefront. Three temporary merch images live under `public/textures/merch-placeholders/`; `lib/bedroom-merch-surfaces-v002.json` records their stable filenames, aspect ratios and intended replacements so real designs can be swapped later without remodeling the room. Matching v002 collision covers the bed, wardrobe and dresser while preserving the office doorway and an east-side route through the room.

### Basement mechanical furnishing — 2026-09-08

Built the locked Mechanical room as a believable service plant before adding its later preparation and puzzle logic. The east wall now carries a high-efficiency furnace, return plenum, supply trunk and water heater; the north-west corner holds a softener and brine tank. A breaker panel, color-coded service pipes, shutoff valves and pressure/status controls establish the power, water, HVAC and pressure affordances required by the experience bible without fixing their eventual interaction sequence. Equipment remains on the perimeter, leaving the west doorway and center service aisle clear. Matching v002 collision covers the three floor-mounted equipment groups.

### Gate house loading — 2026-09-08

The gate previously waited on the full 6.77 MB, 60,000-triangle exterior house before revealing its small background hero. Added a derived gate-only asset that preserves the approved silhouette and material treatment at 529 KB and 19,200 triangles. The full exterior remains unchanged for the walkable experience, and the gate still warms it after the initial page settles. Local browser verification confirmed the optimized house renders in the existing composition.

The optimized asset initially exposed a cold-cache gap because the gate rendered nothing while the new file downloaded. The gate now paints an immediate low-detail house silhouette, replaces it with the approved detailed model when ready, loads that model from the site's own origin, and supplies explicit Cloudflare cache headers. This keeps the house present through variable network and CDN response times.

### Living-room softening pass — 2026-09-07
Added restrained ivory side curtains to the two front sash windows, a quiet framed landscape on the north wall, and a broad-leaf plant behind the sofa. These pieces stay against the room perimeter and add no new walking obstruction. Updated furniture export is 13,840 triangles, 16 material primitives and 1,381,004 bytes. Architecture and traversal regressions pass. The browser inspection helper was unavailable after the model switch, so this pass remains pending a live visual acceptance check before further decoration.

### Exterior grounding race fix — 2026-09-07
Production intermittently showed the exterior house missing or sunken until refresh. HouseModel previously waited two animation frames, measured the already-mounted/scaled group and mutated its height. Ground alignment now measures a detached copy of the loaded GLB and derives the scaled Y offset during render. The source model bounds require a 3.181621m world-space lift at scale 8. This is intended to make first load, refresh and hot reload use the same placement.

### Back Entry / Mudroom and basement Laundry relocation — 2026-09-08

Implemented the newest locked service-room program. The stable ground-floor `laundry` id now represents the Back Entry / Mudroom and its north exterior wall has a generated 1.0m rear-door opening. A dedicated furnishing asset adds a glazed smoked-oak back door, entry mat, compact bench/cubbies, hooks, boot storage and a small household landing cabinet while preserving the Kitchen approach and the new exterior route.

The washer, dryer, utility sink, supplies and practical storage moved to the small basement room with stable id `secret-room`, beside the Mechanical room. The existing concealed south opening remains intact until the secret-route entrance is deliberately relocated or re-expressed, so this layout change does not erase the locked future progression. Furniture collision now mounts with the basement rather than the ground floor. Kitchen → Pantry → Dining circulation, basement laundry access, furniture collision cleanup and all six stair traversals pass.

Laundry refinement turns the appliance placement into a fitted residential service room. A continuous folding counter and overhead cabinets now unify the washer/dryer wall; paired sorting hampers, wall-mounted drying hardware, a stored ironing board, folded linens and visible appliance hookups fill the perimeter without taking over the central aisle. The hamper bank has matching collision, while the concealed south approach and the route from the arcade through the working aisle remain open.

The 2026-09-08 layout update supersedes the earlier second-floor bedroom paragraph above: `guest-room` is now the small Guest / Gag Bedroom; `nook` is the future Master Bedroom; `upstairs-storage` and `linen` are planned to merge into its Walk-in Closet / Dressing Room. Existing merch furniture remains a temporary conflicting implementation until that relocation pass.

### Master suite relocation and dressing room merge — 2026-09-08

Resolved that temporary conflict. The bedroom furniture now occupies the west-side `nook` geometry as the Master Bedroom; the east-side `guest-room` is clear for its later Guest / Gag Bedroom treatment. The master uses a west-wall bed, upholstered navy headboard, nightstands, north-wall dresser, window chaise, dressing mirror, bench, rug and restrained replaceable Grey Key merch surfaces while preserving the south entrance and east closet route.

The wall between stable ids `upstairs-storage` and `linen` is removed visually and from collision, and the redundant second bedroom doorway is closed. Both footprints now read as one connected Walk-in Closet / Dressing Room entered at z=8.5. Continuous hanging storage, drawers, shoe shelving, accessory storage, mirror and a clear center aisle replace the former utility racks and linen press. Apparel uses the existing replaceable merch material so final designs can be swapped without remodeling.

### Stackhouse Arcade spatial pass — 2026-09-08

Populated the basement `basement-landing` as the Stackhouse Arcade without changing its shell. The south end is a modern console/TV lounge, the middle holds five purposefully different placeholder arcade silhouettes plus pinball, a dedicated two-chair chess table, poster and game-box storage, and the north end carries a seven-foot pool table and cue rack. A dartboard and regulation throw line use the clear east-side strip. The east stair/mechanical doors and concealed north laundry/secret-route opening remain reachable.

All five cabinet marquees and side-art panels, the pinball backglass, television, poster wall, box art and room sign use 15 explicitly named swap materials recorded in `lib/game-room-furniture-v002.json`. Ten stable nonfunctional interaction anchors cover the cabinets, pinball, console, pool, darts and chess so future gameplay can attach without remodeling. The environment is 19,756 triangles and 1.36 MB; collision, access routes, TypeScript and Blender inspection pass. A v002 export-axis error that initially sent cabinet side-art through the ground floor was caught during review and corrected; the complete arcade now stays below the ground slab.

### Guest bedroom preservation — 2026-09-09

User clarified that the existing east guest bedroom furnishing was approved and should be retained. Restored its exact previously committed furniture as a separate guest-bedroom asset and collision set, alongside the new west master suite. This remains a comfortable ordinary guest bedroom; future jokes should be subtle details within it. The studio remains deferred by request.

### Cloud repository audit — 2026-10-01

Repository-only pass (no browser, no GPU, no Blender). Nothing visual, collision-feel or performance-related was physically verified; that is listed in the handoff below. All of `typecheck`, `lint` (0 errors), `validate`, `check:generated`, `build` and `validate:static` pass. `check:architecture` passes every geometry, traversal and route assertion but **fails on two real provenance gaps** (see handoff 1–2).

Portfolio truth fixes: lab previews no longer claim to be "live site captures" (Citizen Science is a concept interface, the others prototype captures); stale "media pending" copy removed from LifeOS/CareerOS/Diaspora Atlas/Baseka; ReLearn records its intended role as Bridge Academy's learning engine; game ids/slugs/artwork renamed to `kids-at-the-mall` / `floor-is-negotiable`; the Home Office list no longer calls ReLearn a concept or Grey Key Studios "Michael's music production alias".

Engineering fixes: `/house` initialised the architecture choice to `null`, so every load mounted legacy floors plus the DoorPlaceholder/ExitDoor lights and unmounted them a frame later — a light-count change (full material recompile) on load; it now starts on `v002`. Production loaded GLBs from GitHub raw `main` (version skew on previews, ~17 MB exterior could download twice after the gate's same-origin warm-up); models are now same-origin and the deploy fails instead of silently deleting >25 MB files. Legacy shells are no longer preloaded at import, and the gate warms v002. Removed four never-existing favicon references (four 404s per page), 18 never-imported components, the superseded storage/linen furniture modules and GLBs, and a duplicate grass GLB. Regenerated the stale legacy `interior-{ground,second}.glb` and the elevation drawing (back door was missing). Portfolio nav links got a real focus ring.

Stale-hash note: `scripts/check-architecture-v001.mjs` stamped freshness with `sha256(lib/interior-layout.ts)`, a value that matched no committed revision, so the regression had been red since 2026-09-07. It now compares the JSON each Blender script actually consumed with what the current plan derives.

Open questions for the owner (not changed): "Chart Colleseum" spelling (record says "retained until confirmed"; the image file is `chart-colosseum.png`); `1899-waltz.png` artwork ships but is not wired to anything; "App Triage" and "Prompt Pilot" appear only in the Home Office list; GK World has no portfolio record at all; no real favicon exists; `@vercel/analytics` is mounted on a Cloudflare deploy where its script cannot load; the Geist fonts are instantiated but never applied.

Asset weight (export): portfolio images 50.7 MiB, models 34.5 MiB. The game/Bridge concept PNGs are opaque 1672×941 images at 2.3–3.0 MB each; re-encoding them (WebP/AVIF or q≈85 JPEG) would likely cut the images by more than 80 %, but needs a visual sign-off.

## LOCAL Stack House worker — handoff (2026-10-01)

Do these on a machine with a browser, GPU and Blender. Run `npm ci --legacy-peer-deps && npm run check` first; it should be clean.

**1. Floor finishes are stale (Blender).** `floor-finishes-layout-v002.json` predates the walk-in-closet merge (`nook`, `upstairs-storage`, `linen` changed: the nook→linen doorway and the storage/linen wall were removed). Run `node scripts/export-floor-finishes.cjs`, rebuild with `scripts/build-floor-finishes-v002.py` in Blender, then in the browser check the closet floor for a carpet seam or threshold cut along the old wall line (z≈9.4) and at the old doorway (x≈298.85, z≈10.1). Commit the JSON, manifest, `.blend` and both GLBs together.

**2. Commit the back-entry Blender source.** `portfolio-assets/stack-house/blender/back-entry-furniture-v002.blend` and `.manifest.json` were never committed, although the GLB was. Commit them from the machine that built `public/models/back-entry-furniture-v002.glb` (re-export only if the GLB must change). After 1 and 2, `npm run check:architecture` must pass; it runs in CI.

**3. First-load hitch (browser, `/house?stats`).** The architecture choice now starts on v002. Confirm: no frame freeze when the house first appears, no legacy `interior-*.glb` requests in the network tab, no red DoorPlaceholder orbs or green exit glow in the default view, and that `?architecture=legacy` and `?architecture=v001` still switch and work.

**4. Same-origin models on a deployed preview.** On a Cloudflare preview deploy of this branch: exterior house, willow, lamps, bushes, fence and grass load from the site's own `/models/` (no `raw.githubusercontent.com` requests), the gate→house transition does not re-download the house/tree, and Cloudflare serves the 11 MB tree without error. Note load times compared with production.

**5. Legacy view geometry.** `?architecture=legacy`: the regenerated ground/second shells should show the back-entry exterior door and an open walk-in closet (no wall between storage and linen, no second doorway). Collision already followed the plan.

**6. Gate warm-up.** Open `/`, wait ~3 s, then enter the house: the four `interior-*-v002.glb` shells should come from cache.

**7. Desktop/touch regression sweep** (nothing here changed them, but this pass touched the house page): `?controls=desktop` and `?controls=touch`, post-processing on desktop only, six stair traversals, foyer entry/exit, back door route, Kitchen → Pantry → Dining, basement laundry access.

**8. Portfolio page visual check** (`/portfolio`): Lab cards and game cards render with renamed `kids-at-the-mall.png`; nav links show a focus ring with Tab; no console 404s for icons.

**9. Decisions to bring to the user** (do not decide them yourself): the open questions above, whether to re-encode the concept PNGs, and whether the 14 remaining lint warnings (hook dependency arrays in R3F code) are worth a pass — each needs runtime testing, so they were left alone.

## Local verification pass — 2026-10-01

Run on Michael's HP ZBook 14u G6 (**Intel UHD 620, the only GPU**), Chrome +
ANGLE/D3D11, driven by Playwright with real keyboard and CDP touch input; the
in-app browser pane throttles rAF when hidden, so its fps numbers are useless.
Treat this machine as the low end: a 1280x720 desktop frame here is the honest
worst case.

Reconciled first: worked from the cloud worker's branch
`claude/adoring-carson-cg3tej` (draft PR #3, on top of `main`), new local branch
`claude/local-verification-pass`. Nothing pushed.

**Fixed (each reproduced, root-caused, retested, guarded):**

| Defect | Cause | Result | Guard |
| --- | --- | --- | --- |
| Interior 6-7 fps on this laptop | shower glass used glTF transmission → second full scene pass, in frame from most of two floors | foyer 162 → 84 ms, landing 138 → 71 | invariant + architecture check |
| Player wedged at the end of every stair flight below ~40 fps (walk) / any sprint phase that skipped the band | one movement step per frame jumped the 5 cm handoff band; step guard refused forever | all 6 flights pass at 60→5 fps, walk and sprint, live and headless | 24 low-fps traversals in `check:architecture` |
| Home Office prompt could not be triggered from the front of the v002 desk | interaction still on the legacy desk spot at floor height (2.2 m radius ≈ 1.5 m at eye level) | reachable from every side; does not leak through walls | — (placement derived from `office-dressing-v002.json`) |
| Home Office overlay invisible (in production too) | `postcss.config.mjs` empty since the first deploy; Tailwind never ran; `fixed inset-0` never applied | panel renders; gate/portfolio computed styles unchanged across ~1,000 elements | invariant + `validate:static` |
| 1.9 s freeze on first reaching the basement, 0.2-0.4 s on every yard/house crossing | five component lights inside visibility-toggled groups → light count 14/11/10 | count 11 everywhere; pool 7 → 8 keeps interior shading identical (a permanently-mounted alternative cost 15-20 % fps and was rejected) | invariant |
| 4-5 s freeze when walking through the front door | first use of ~40 interior programs; 97 % in `getProgramInfoLog` (driver link) | 141 ms; the ~4.8 s warm frame now runs under the boot credits | — |
| `check:architecture` red | stale floor-finish export; back-entry `.blend` never committed | rebuilt in Blender 5.2.1 (GLBs byte-identical), source committed; green | existing |

Also added `scripts/check-circulation.mjs` (in `check:architecture`): every
interior doorway, both directions, with all v002 furniture colliders mounted
(36 crossings; verified it catches an injected blocker).

**Verified working, no change needed:** front-door entry and exit-to-yard by
real input; Kitchen → Pantry → Dining, back-entry, closet and basement laundry
routes (circulation sweep); touch joystick, two-finger look, no drift on
release, USE button, joystick stair climb; post-processing off on touch;
no stairwell voids looking up/down from every floor; all 22 rooms render with
no missing geometry or z-fighting; no console errors or failed requests on
`/house`; no legacy interior GLBs on the default view; `?architecture=legacy`
and `v001` still load and render; gate warm-up serves the four v002 shells from
cache; `/portfolio` artwork, focus ring, no 4xx. Camera/FOV and PLAN_SCALE were
not touched.

**Measured, current (Intel UHD 620, 1280x720, desktop with post):** yard
~20 fps (788k tris, 85 calls); interior 14-27 fps depending on view (foyer
~70 ms, kitchen ~45 ms, attic ~36 ms). Interior cost scales with resolution
(fill-bound) and roughly halves when neighbour-floor furniture is hidden —
neighbour floors stay visible by rule, so that is a decision, not a fix.

**Cloud handoff status:** 1 floor finishes ✔ · 2 back-entry source ✔ · 3
first-load hitch ✔ (see above) · 4 same-origin models on a Cloudflare preview —
NOT done (needs a deploy) · 5 legacy view ✔ · 6 gate warm-up ✔ · 7
desktop/touch sweep ✔ · 8 portfolio check ✔ · 9 still Michael's.

**For Michael (not decided here):**
- The house HUD/overlay text now uses the system sans its classes always
  asked for; it was rendering in the browser's default Times New Roman.
- `<Environment preset="night">` fetches its HDR from `raw.githack.com` at
  runtime. If that third-party CDN is slow or down, the whole Canvas suspends.
  Self-hosting the 1k HDR under `public/` is a small change but adds a file.
- Yard is the heaviest scene on low-end GPUs (788k triangles, mostly the willow
  and exterior house; the 2048 shadow map redraws them every frame). Reducing it
  is asset/art direction work.
- Legacy/v001 review views still mount DoorPlaceholder/ExitDoor lights inside
  floor groups, so they still recompile on floor changes. Opt-in only.
- Grey Key Studios, Library/Study and the Archive remain unfurnished by design;
  the arcade interaction anchors still say "coming soon".


### Concept art re-encoded to WebP — 2026-10-02

The ten concept-art images (eight game concepts, GK Backlot, Bridge Academy hero) are now lossy WebP at full resolution: 24 MiB → 4.3 MiB, and the exported portfolio images went from 50.7 to 30.8 MiB. Recipe: `ffmpeg -i in.png -c:v libwebp -lossless 0 -quality 92 -compression_level 6 -preset picture out.webp` (ImageMagick's `-quality` had no effect on WebP in the cloud container). Full-image SSIM is 0.91–0.97, which mostly reflects grain smoothing. 1:1 crops of the two lowest scorers (Corporate Espionage Sim, Cooley's Revenge) were visually indistinguishable, including UI text and saturated reds. The PNG masters remain in git history; screenshots, UI captures and persona portraits were left as PNG. Local worker: glance at the Game Lab and Bridge sections of `/portfolio` on a real display.

Persona portraits followed (same recipe, q92): the six images in `public/portfolio/music/artists/` (all opaque) went from 10.0 MiB to 1.0 MiB, with SSIM 0.945–0.962 and PSNR 35.6–42.7 dB. 1:1 face crops of the two lowest scorers (CHNO, Adwo Nyumbani) showed no visible difference and no shadow banding. Exported portfolio images are now 21.8 MiB.

Music project artwork followed, converting only where WebP actually helps: `1899-waltz` (2.1 MiB → 248 KiB; still unreferenced), `destination-terra-gaia` (1.9 MiB → 106 KiB; 1:1 crop checked, no sky banding), `abstract-waltz`, `cardboard-portraits`, `games-on-channel-3` and `plastic-horizons` (each 21–65 % smaller, SSIM ≥ 0.964). The other five stay JPEG: four were already compact lossy files, so WebP was larger or under 6 % smaller. The 637 KiB Soundtrack for an Unmade Film cover only reached 510 KiB at a visible fidelity cost. Re-encoding an already-lossy JPEG compounds loss, so it is not worth it for those savings. Exported portfolio images: 18.0 MiB (from 50.7).

### 1899 Waltz wired in + music project thumbnails — 2026-10-02

Owner confirmed that "1899 Waltz" is a released single (Adwo Nyumbani feat. Mr. E) that will also appear on the album Abstract Waltz. It now has its own Adwo Nyumbani project record with the `1899-waltz.webp` cover, placed before Abstract Waltz, which still lists the track. The music section's project lists now show a 36 px cover thumbnail beside each title (decorative `alt=""`, lazy-loaded; an empty frame where no art exists). That surfaces the covers that were wired in data but never displayed. Verified in headless Chromium at 1440 px and 390 px. `validate-portfolio` encodes the single + album relationship.
