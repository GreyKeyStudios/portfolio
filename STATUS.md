# Stack House — Status

_Last updated: 2026-09-05_

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

**The interior is a shell in progress.** Four floors, 22 rooms, correct plan,
correct collision, working vertical movement, trim, door openings and windows
resolved. Untextured and unfurnished. This is the current work front.

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
| Rooms furnished | 5 of 22 flagged `furnished`, but only the home office has real geometry (`components/interior/home-office-room.tsx`); the other four are circulation |
| Everything else | `DoorPlaceholder` markers, now DERIVED from unfurnished rooms + `ProxyFurniture` scale boxes |

Interior GLBs are 51–299 KB each — pure procedural geometry, no textures, no
props. That number is the honest measure of how much room there is to grow.

### Load-bearing constraints (do not relearn these the hard way)

- **X0 = 300.** Interior lives 300 units off in world space; yard clamps the
  player to x∈[-25,25]. Both scenes stay mounted, visibility-toggled — no
  mount/unmount on teleport, so no pop-in.
- **Fixed light pool of 7.** `POOL_SIZE` in `app/house/page.tsx`. Changing the
  *number* of active lights recompiles every material in the scene (measured:
  666 ms frozen frame). Never mount, unmount, or `visible={false}` a light —
  reposition pool slots and dim to 0 instead.
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
- **Render resolution is capped at dpr 1.5** on the house Canvas (2026-09-04).
  It was unset, and r3f defaults to [1, 2] — so a devicePixelRatio-2 display
  rendered 4x the pixels, post passes included. The gate scene had always
  clamped; this one never did. `powerPreference: high-performance` added at the
  same time so laptops stop using the integrated GPU.
- **`/house?stats`** shows frame timing, draw calls, triangles and the real
  backing-store size. Measured 2026-09-04: interior 78 draw calls / 10.3k tris,
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

Both are one-liners against the transpiled layout in `.interior-build/`, and both
caught real breakage during the re-cut:

- **Door pairing.** Every interior door must have a matching entry on the room
  the other side; the front door is the only legitimate unmatched one.
- **Floor plate coverage.** Each storey's rooms must sum to exactly the footprint
  area. Under-tiling means holes in the floor, over-tiling means z-fighting.

### FOV — the open question

75° is wide. Arch-viz walkthroughs sit at 50–60. An A/B at 60 from the same spot
made rooms read noticeably more like photographs — less edge distortion, windows
at their true size — at the cost of peripheral vision while walking. **Left at 75
pending a call**; it is one number in the `<Canvas camera>` prop in
`app/house/page.tsx`.

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
```

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

