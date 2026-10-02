# Stack House — independent audit (Claude)

_2026-09-06. Read-only review. No application code, models, materials,
dependencies, Git state or existing documentation were modified. Nothing was
bought, downloaded, installed or imported._

Sources read: `AGENTS.md`, `docs/STACK_HOUSE_EXPERIENCE_BIBLE.md`,
`lib/interior-layout.ts`, `STATUS.md`, `docs/ARCHITECTURE_V002.md`, plus
`lib/architecture-details.ts`, `lib/colliders.ts`, `lib/collision.ts`,
`lib/player-camera.ts`, `lib/player-store.ts`, `app/house/page.tsx`,
`components/interior/*`, `scripts/build-entry-door-v002.py`,
`scripts/build-shell-details-v002.py`, `scripts/build-skyline-plate.py`,
`scripts/render-skyline-plate.py`, `docs/elevations.svg`, and the exported GLBs.

All LOCKED decisions are preserved. Nothing here proposes changing
`PLAN_SCALE`, room identities, the arrival gameplay, or the interior's
deliberate spatial separation from the exterior. The 1.62 m / 65° interior
camera is treated as the fixed baseline. Empty rooms are not reported as
defects.

---

## 0. Verification status — read this before acting on anything below

**Revised 2026-09-06 after a live v002 walkthrough.** The first pass could not
run one: port 3017 was down and the only server up was Codex's checkout at the
merge base `5c47c0a`, with none of the v002 work. The user then authorised
starting a server, so `npx next dev -p 3017` was run against **this** checkout
and the whole house was walked at `?architecture=v002`.

What that changed, and it matters:

- **Two inferred findings were wrong and are corrected below.** The interior
  windows *do* have divided lights (P2), and the interior trim reads better than
  the material factors suggested (§2.3). Both corrections are marked in place.
- **One suspicion was investigated and cleared** rather than reported — see
  §4.4 on stair balusters.
- **One bug was found that source inspection could not have surfaced** — the
  floor light streaks, now **P2**.
- **The exit-to-yard bug is now verified end-to-end on HEAD**, by calling the
  real `exitToYard()` from inside the v002 foyer, not just by teleport
  simulation on the merge base.

Method and remaining limits:

- Navigation was by `requestTeleport` from the console, which sidesteps pointer
  lock — the in-app browser rejects it (`WrongDocumentError`), and that is the
  only console error the whole walkthrough produced.
- **`requestTeleport`'s `floor` does not change floor identity.** It sets the
  camera, but `currentLocation` stays put and the vertical resolver then snaps
  you back to the old storey. `setCurrentLocation(floor)` must be called first.
  This cost me two wasted passes and is worth knowing before anyone writes a
  debug-teleport helper.
- **Camera pitch could not be driven**, so ceilings and floors were judged from
  level views and raking angles only. Nothing here rests on a look-up.
- Appearance was judged with `?controls=desktop` (post-processing **on** —
  confirmed, since `controls=desktop` forces `isMobile` false, which gates
  `SceneEffects`). A second pass at `?controls=touch` was used only for
  geometry, with post off; that is stated wherever it applies.
- **No screenshots could be saved to disk.** The canvas has no
  `preserveDrawingBuffer` (verified — `toDataURL` returns a uniform black
  frame), and fixing that meant editing `app/house/page.tsx` while Codex is in
  there. `docs/audits/claude-house/OBSERVATION-LOG.md` records the exact
  teleport coordinates behind every visual claim instead, replayable in one
  console line each.
- The dev server on 3017 was left **running**. Port 3001 (Codex's checkout) was
  not touched.

Every finding is tagged **[VERIFIED]** (seen live or measured from a file) or
**[INFERRED]** (reasoned from source). After the walkthrough almost everything
is VERIFIED; the few remaining inferences say so.

---

## 1. The five highest-priority findings

_Live ranking: **P1 → P5**. **P6** is the original P1 (skyline provenance),
closed by the user and kept for the record — it appears immediately after P1
only because that is where it was written; ignore it when reading the ranking._

### P1 — The floor below z-fights through every storey's floor *(bug)* [VERIFIED live + measured]

Standing anywhere in the **Library / Study** (`gallery`, second floor), the
floor carries **bright, hard-edged pale bands** in a rough cross pattern —
clearly visible against the dark floor material, in a room whose only windows
are opaque night glass with no light source behind them and which has no
ceiling fixture in view.

**Diagnosed, and the user's instinct was right — it is the floor below clipping
through.** Every storey's walls and the next storey's floor slab have
**coplanar horizontal faces at exactly the same Y**, so they z-fight, and the
fighting shows up as striped bands tracing the layout of the storey *underneath*.

The measurement, straight from the exported GLB bounds:

| Asset | Local Y span | Mounted at | World Y span |
| --- | --- | --- | --- |
| `interior-ground-v002.glb` | −0.120 → **3.200** | 0 | −0.12 → **3.20** |
| `interior-second-v002.glb` | −0.120 → 3.200 | **3.200** | **3.08** → 6.40 |

Walls run the full `FLOOR_TO_FLOOR` 3.2 (deliberately — `STATUS.md` records that
stopping them at the ceiling left a 0.4 gap to the storey above). So every
ground-floor wall has a 0.2 m-wide **top face at Y = 3.200**. The second floor's
slab occupies 3.08 → 3.20, so its **top face is also at Y = 3.200**. Coincident
surfaces, no depth separation, z-fight. The same arithmetic holds at
basement→ground (both at Y = 0.00) and second→attic (both at Y = 6.40), so
**this affects all four storey boundaries.**

Four observations that confirm it and rule out the alternatives:

| Where | Wall below? | Streaks? |
| --- | --- | --- |
| Library / Study, second floor | Yes — ground-floor partitions at x = 295.1 and z = 3.0 | **Yes**, tracing exactly those two lines |
| Storage, second floor (core) | No partition in view | **No** |
| Kitchen, ground floor | No — the whole basement below it is one undivided room | **No** |
| Archive, attic | Yes — second-floor walls | **Yes**, banding along the floor |

- **Not a light shaft through the windows.** The streaks do **not** line up with
  the openings — verified by standing square to both the west and south windows
  in the Library and finding the bands elsewhere. And the windowless Storage
  room would still have shown the key light if that were the mechanism.
- **Not post-processing.** Present with N8AO and bloom on *and* off.
- **Not specular.** The bands hold their world position as the camera moves.
- **Not the staircase asset**, though it is worth knowing that
  `staircase-v002.glb` is 4.020 tall against a 3.2 floor-to-floor and therefore
  *does* project 0.82 m into the storey above. That is by design — it lands in
  the stairwell opening — but it is the other place to look if anything similar
  turns up in the stair core.

It shows up most in the Library because that room is bare shell over two
ground-floor partitions. The Client Room hides it: the oak boards from
`foyer-client-details-v002.glb` sit at Y = 0.006, a few millimetres proud of the
slab, which is exactly the separation the slab itself lacks.

*Fix:* stop the walls just below the slab underside rather than at the storey
line — run them to about 3.15 (or to `FLOOR_TO_FLOOR - 0.12`) in
`scripts/build-interior.cjs`. The wall top is then buried inside the slab, so
there is still no gap to the storey above and no coincident faces. A depth-bias
or polygon-offset tweak would only mask it, and would have to be re-tuned at
every camera distance.

**If the room you remember seeing this in is not the Library, it is very likely
still this.** The mechanism is not room-specific — it fires wherever a storey
sits over a wall on the storey below, which is most of the house, on all four
boundaries. The Library is simply where I happened to catch it, and the table
above shows the pattern rather than a single case.

Two things it would *not* explain, worth ruling out separately if the
remembered case does not match: a striped artefact **in the stair core**, which
would more likely be `staircase-v002.glb` projecting 0.82 m into the storey
above; and anything **in the yard**, which is a different scene with a different
light rig and is not covered by this diagnosis at all.

### P6 — Skyline provenance *(CLOSED — out of rank order, kept for the record)*

**The user has confirmed the skyline is being redone, so this is no longer
actionable.** The history is kept because it explains a stale comment that is
still in the code and still misleading.

_Originally raised as P1, then re-investigated after the user said "I could have
sworn we generated that skyline." They did. The history resolves it exactly._

On **2026-08-16**, in a single afternoon:

| Commit | Time | What happened |
| --- | --- | --- |
| `3983ed3` | — | "Replace the stock skyline with our own rendered city" — `render-skyline-plate.py` written, own Meshy city rendered, plate blob **588,275 bytes** |
| `ccad7b2` | 12:03 | Tuned that render (window scale, emission, anisotropy); "still under a third of the stock photo it replaced" |
| `f8ace9b` | **12:30** | **"Go back to the photo, and cut its sky out instead"** — the render "lost a direct A/B… Photogrammetry gives good massing and bad facades" |
| `6862dd5` | — | Final photo-derived plate, blob **1,040,221 bytes** |

`public/textures/skyline.png` on disk today is **1,040,221 bytes** — byte-identical
to `6862dd5`, and a different blob from the 588,275-byte render at `3983ed3`.
**The shipped texture is the photo, not your render.** `build-skyline-plate.py`
is the live pipeline, it reads
`SRC = os.path.expanduser(r"~\Downloads\skyline.png")`, and its header says
plainly: "it is not ours."

The memory is genuine and the confusion has a cause: the comment in
`components/skyline-plate.tsx` saying "The texture is now a RENDER of our own
city model rather than a stock photo" was written **in `3983ed3`** and was never
updated when the revert landed 27 minutes later. `git log -S` confirms it has
not been touched since. It has been describing a superseded pipeline for three
weeks.

So the actual risk is narrower and more tractable than my first pass implied:

- It is **not** ambiguous which pipeline is live. It is the photo.
- `f8ace9b` calls it a **"stock photo"** four times. That wording suggests a
  stock library — which usually means a real licence exists, possibly a
  perfectly permissive one. But the library, the licence and the URL are
  recorded **nowhere in the repo** (a grep for
  `unsplash|pexels|shutterstock|licen[cs]e|attribution|credit` finds nothing),
  and the source file lives in `~/Downloads`, outside version control.
- `public/textures/minneapolis-skyline-cinematic.png` (1.94 MB, added
  `bb24a43`, 2026-08-24) has no provenance record either.

**The one thing still worth doing:** fix the stale comment in
`skyline-plate.tsx`. Whatever replaces the plate, a comment claiming the texture
is a render of your own city — when it has not been since `f8ace9b` — will
mislead the next person exactly as it misled this audit. §3.3 keeps the
clean-licence sourcing options in case they are useful for the redo; it is no
longer a finding.

### P2 — Interior windows are exactly square; exterior windows are portrait *(consistency)* [VERIFIED both sides]

> **Correction.** My first pass claimed the interior sashes were plain 1-over-1
> with no muntins, inferred from the wording in `docs/ARCHITECTURE_V002.md`.
> **That was wrong.** Seen live, the interior windows have a **2 × 2 divided
> light grid**, a substantial meeting rail with painted lifts, an inset sash
> frame, a reveal liner, and a projecting sill with an apron beneath. It is
> genuinely good joinery, and the muntin *pattern* matches the exterior's 2 × 2
> upper windows. Only the proportion finding survives — and it survives
> strengthened, because it is now measured rather than computed.

Every interior opening on the ground and second floors is **1.20 m tall**
(`WINDOW_SILL 0.9` → `WINDOW_HEAD 2.1`) and 0.8–1.6 m wide — the common cases
being 1.0 × 1.2 and **1.2 × 1.2, exactly square**.

Confirmed on screen. A straight-on shot of a Client Room front window at
`('ground', 302.4, 1.6)` puts the outer casing at **358 px wide × 357 px tall —
1.00 : 1**. The pair seen together from `('ground', 303.8, 4.2)` read as two
small squares low on a large blank wall, with a **conspicuous expanse of plaster
above them**: the 2.10 m head under a 3.00 m ceiling leaves 0.90 m of empty wall,
and at 1.62 m eye height that band sits directly in view above the glass.

The exterior windows are consistently **taller than wide**, roughly 1:1.4
(measured off screenshots E6/E7, ±10%), and the ground-floor ones have
**segmental arched heads**. So the mismatch is now precisely nameable: same
muntin pattern, wrong proportion, and the exterior's arched heads have no
interior counterpart.

Window shape is the most legible signature of a house's period, and it is the
thing a visitor sees most of on both sides of the wall. It remains the most
noticeable inconsistency in the project — and the blank band above each head is
a plausible contributor to the residual "scale feels slightly odd," since it is
most stark in the *undetailed* rooms where there is no cornice or dado to break
the wall up (see §4.4).

*Recommendation (not implemented):* raise `WINDOW_HEAD` to ~2.40 and trim the
default widths to 0.9–1.1. That gives ~1:1.4 portrait openings and a ~0.6 m
header, matches the exterior, and is **one constant plus a regeneration** — the
muntins already exist, so this is far cheaper than my first pass assumed. Re-run
`npm run elevations` after, per the existing rule.

### P3 — Exiting the house teleports the player 1.29 m inside the house collider *(bug)* [VERIFIED live]

`YARD_EXIT_POINT = [0.72, 1.7, -3.5]` (`lib/interior-layout.ts:782`). The
`house` AABB in `lib/colliders.ts` is `minZ: -4.571`, and `resolveCollision`
inflates it by `PLAYER_RADIUS` 0.22 to **-4.791**. The exit point is 1.29 m
inside that box.

**Reproduced end-to-end on the live v002 build.** Standing in the v002 foyer at
the real arrival point `[300, 1.62, 0.65]` and calling the actual
`exitToYard()` — not a simulated teleport — leaves `window.__pos` at
**`z = -4.791`** instead of the declared `-3.5`. That is the
axis-of-least-penetration push-out, exactly as predicted from the collider
maths. Every exit from the house begins with an instantaneous 1.29 m lurch
backwards through the front wall.

It is currently masked because `YARD_EXIT_YAW = 0` faces the player away from
the house, so the snap happens behind them, and they land inside the front-door
USE radius so the prompt appears correctly. It will stop being masked the moment
arrival gameplay gives the player a reason to turn around on the step.

*Recommendation:* move `YARD_EXIT_POINT` z to about **-5.1** — clear of the
inflated collider with margin, and still comfortably inside the 0.9 m front-door
proximity radius centred at z = -4.6.

### P4 — The exterior has a prominent attached garage that the interior does not acknowledge at all *(consistency)* [VERIFIED]

The exterior model is dominated on its `+X` side by a full attached garage with
an arched, panelled garage door and its own driveway and apron (E1, E2, E3).
It is roughly a third of the front elevation and the second thing a visitor
looks at after the entrance.

There is **no garage anywhere in `ROOMS`**, and no door to one. The Mudroom —
the room that exists precisely so "neither the Kitchen nor the bathroom is
reached by walking through the other," and the obvious garage entry in any real
plan — has doors west, east and north, to the Half Bath, the Foyer and the
Kitchen. Nothing else.

And the sides are crossed. Facing the house, `+X` is the viewer's left and is
the garage. Inside, `+X` is the **Client Room / Living**, whose two front
windows sit at plan X 9.0 and 11.8. So the room with the two street-facing
windows occupies, in the visitor's mental map, the volume they just watched a
garage door fill.

This is not the intentional spatial separation — the separation is about
footprint and fit. This is a specific, nameable object present outside and
absent inside. Cheapest resolutions, in order: give the Mudroom a west door
labelled "Garage" that stays locked (satisfies the expectation without building
anything); or accept it and let the joke carry it, since "THIS ISN'T EVEN MY
HOUSE" is a licence to have a garage you cannot get into.

### P5 — The weeping willow is neither a willow nor affordable *(subjective + budget)* [VERIFIED]

`tree-main-optimized.glb` is **100,000 triangles / 11.36 MB** — the largest
asset in the project by a wide margin, 1.7× the entire exterior house
(60,000 tris / 6.77 MB), on a Cloudflare Pages static export where asset weight
is called a hard budget in `STATUS.md`.

What it buys (E8, close range): a dome of large flat leaf blades on a smooth
flared cone, no branch structure, no bark detail, no fine drooping fronds, in an
icy blue-white that reads as frost rather than foliage. At distance (E1, E4) the
silhouette *does* weep and the mass sits well against the house, so the
composition is right — but the object does not survive being approached, and it
is the yard's single most-approached prop.

Scale is also off: the model is 1.096 × 1.518 units, rendered at scale 5, so
**5.5 m wide × 7.6 m tall** against an 8.12 m house. A mature weeping willow is
10–20 m tall and typically *broader than tall*. It currently reads as a shrub
that happens to be tree-shaped.

Section 3.1 has the replacement options. The short version: authoring it in
Blender is both cheaper and better than any asset I found.

---

## 2. Exterior / interior consistency audit

Measured baseline, so the rest of this section has numbers behind it:

| | Exterior | Interior |
| --- | --- | --- |
| Footprint | **10.91 × 9.02 m** (GLB bbox 1.364 × 1.127 at scale 8, *including garage*) | **13.20 × 10.80 m** (`HOUSE_W`/`HOUSE_D`; confirmed by `interior-ground-v002.glb` bounds) |
| Yard collider | X −4.835…6.272, Z −4.571…4.639 | — |
| Height | 8.12 m to ridge | ground 0 → attic base 6.4, + roof |
| Storeys read from outside | 2 + roof, no dormers, no window wells | 4 (basement, ground, second, attic) |
| Triangles | 60,000 | 12,628 across all four v002 floor assets |

The interior is 1.21× wider and 1.20× deeper than the *whole* exterior. Against
the habitable block alone — the exterior minus the garage, which I estimate at
~7.5 m of the 10.9 m frontage from screenshots and have **not** measured — it is
closer to 1.8×. That is the honest size of the gap, and per the brief it is
accepted, not a finding. The findings below are the ones a visitor notices
in the ten seconds either side of the threshold.

### 2.1 Entrance — the one element already reconciled ✅ [VERIFIED both sides]

The exterior entrance (E2) is a **round-arched opening in a projecting gabled
porch**, with a voussoir-and-keystone surround, **two tall glazed lights over
two lower panels**, warm light behind the glass, and a three-step stoop.

The interior `entry-door-v002` asset follows that exactly: leaf 0.90 × 1.98 m,
arch radius 0.45 springing at 1.548, two panes divided by a 28 mm mullion over
two recessed panels at 0.17–0.77, arched ivory casing, aged-brass lever,
deadbolt and three hinge knuckles. GLB bounds 1.200 × 2.076 × 0.224 m.

The entrance-shape correction landed. This is the strongest piece of
exterior/interior continuity in the project and should be the template for the
window pass.

Three residual differences, in descending order of how much they matter:

1. **Hardware side.** The interior leaf carries its hinges on `-x` and its lever
   on `+x` (`build-entry-door-v002.py`: knuckles at `-w/2 + .012`, lever at
   `w/2 - .10`). A closed door seen from inside hinges on the *opposite* side
   from the same door seen from outside. This needs one look at the exterior
   door's hinge side to settle, and it is exactly the kind of detail a visitor
   registers without being able to name. **Unresolved — I could not see the
   exterior hinges; the exterior door is a baked texture with no modelled
   hardware at all, which may mean there is nothing to match.**
2. **Casing colour.** Ivory inside, saturated pale blue outside. Defensible as
   masonry-outside / joinery-inside, but see §2.3 — the blue/ivory relationship
   inverts across the threshold in more than one place.
3. **Threshold level.** Outside you climb ~0.74 m of stoop (three steps,
   estimated from E2). Inside you arrive at floor level with no answering step
   or landing. Low priority while the transition is a teleport; it will matter
   if arrival ever becomes a walk-through.

### 2.2 Windows — see P2

Adding to P2, the front-elevation *rhythm* is better than the shapes. Parsing
`docs/elevations.svg`, the south (street) elevation stacks correctly: window
centres at plan X **3.50 / 6.60 / 9.00 / 11.80** on the second floor, and
**3.50 / [door 6.60] / 9.00 / 11.80** on the ground, with the attic gable window
also on 6.60. Every opening is vertically aligned. That work is sound and should
be preserved through any head-height change.

Two composition notes, both **INFERRED** from the drawing:

- The west 2.9 m of the front elevation carries **no opening on any floor**,
  while the east end is crowded (11.80 centre on a 13.20 m wall leaves 0.80 m to
  the corner). The facade is left-heavy with a blank west bay.
- The front door sits **dead centre** at 6.60 of 13.20 m. The exterior door is
  markedly off-centre, with the garage west of it. Minor on its own; it
  compounds P4.

### 2.3 Materials, colour and style [VERIFIED — measured from GLB material factors]

| Surface | Exterior (screenshots) | Interior v002 (measured) |
| --- | --- | --- |
| Wall field | near-black / very dark body | `0.58, 0.57, 0.54` ≈ `#c7c6c1` pale plaster |
| Trim | saturated pale/mid blue, high contrast against the wall | `0.68, 0.65, 0.59` ≈ `#d6d2c9` ivory |
| Accent | warm amber only at the door glass | navy panelling `0.042, 0.068, 0.10` ≈ `#3c4b5a`; brass `0.27, 0.18, 0.07`; opal `0.95, 0.75, 0.46` |

Two things fall out of that table.

**The blue/light relationship inverts across the threshold.** Outside: light
trim on a dark body, blue is the *bright* colour. Inside: dark blue is the
*low, heavy* colour and the wall is the light one. Both are legitimate designs;
together they read as two houses. This is the kind of thing to decide
deliberately rather than discover — and one cheap move would resolve it: put
the exterior's blue on the interior *sashes and the front-door casing* rather
than only on the dado, so blue is the "opening" colour on both sides.

**The interior trim barely separates from the wall.** In
`components/interior/architecture-candidate.tsx`, the v002 path overrides the
baked GLB materials at runtime: `wall` is darkened from `0.82, 0.80, 0.76` to
`0.58, 0.57, 0.54`, and `trim` is set to `0.68, 0.65, 0.59`. That leaves trim
only about **17 % lighter than the wall**.

> **Correction.** My first pass concluded from those numbers that skirtings and
> casings "stop doing" their job of giving the camera scale. Seen live, that is
> too strong. In the Client Room the window casings, skirting and stepped
> ceiling cornice all read clearly, helped by the sconce raking across them.
> The finding narrows to two places where the contrast genuinely is marginal:
>
> - **Around the arched front door.** The player is asked to turn back and look
>   at exactly this wall for the exit prompt. The arch is the best piece of
>   joinery in the house, and its ivory casing barely separates from the plaster
>   it sits in — seen at `('ground', 300, 1.6, yaw 0)`.
> - **In the undetailed rooms** — everything outside the foyer and Client Room,
>   which have no cornice, no dado and no oak floor. There the skirting and
>   window casing are the *only* things giving the eye scale, and 17 % is not
>   much to carry a whole room on.
>
> Still worth a few points of extra separation, still one number and no
> geometry. It is no longer my leading explanation for the residual odd scale —
> P2 and §4.4 are.

### 2.4b Roof geometry — the ridge runs the wrong way [VERIFIED exterior, layout-derived interior]

_Added on the second pass; not caught the first time._

**Interior.** The attic's knee walls are on the **east and west**
(`ATTIC_KNEE_INSET`), and `lib/interior-layout.ts` rejects east/west windows
outright because "a 1.15 knee wall cannot hold a window." Its two openings are
**gable windows on the north and south**, clipped out of the triangle. That
fixes the interior ridge as running **north–south, front to back**, perpendicular
to the street — and the attic walkthrough confirms it: rafters and collar ties
run across, with a centred gable window in the end wall you face looking up the
plan.

**Exterior.** Both the front (south) elevation and the east elevation terminate
in a **horizontal eave and fascia band**, with no gable triangle on either. That
reads as a **hip roof**, or a very shallow cross-gable — either way, the only
true gable anywhere on the model is the small decorative pediment over the entry
porch, and there are **no dormers**.

So the interior attic has gable ends with windows facing the street and the back
garden, and the exterior has an eave on both of those elevations and no gable end
anywhere. A visitor who looks up at the roof from the front walk and then stands
in the Archive looking out of a street-facing gable window is in two different
roofs.

*Confidence:* the interior side is certain — it falls out of the layout rules.
The exterior side is a night reading of a photogrammetry-derived mesh, so
"hipped or very shallow cross-gable" is as precise as I will go. What is not in
doubt is that **no gable end is visible on any elevation** except the entry
porch, which is the part that matters.

*Recommendation:* this one is cheap to fix from the **exterior** side later — a
gable end or a pair of dormers on the front slope would reconcile it and give
the attic a presence from the street (§7). Rotating the interior ridge would
mean re-cutting the attic and moving both its windows, which is much more work
for the same result.

### 2.4 Roof, storeys and glazing at night [VERIFIED exterior]

- The exterior reads as **two storeys plus roof**, with a cross-gable, a small
  gabled entry porch, no dormers and no basement window wells. The interior has
  four levels, two attic gable windows and five basement wells. Given the
  separation this is accepted — but the attic is the one place where an exterior
  cue would cost almost nothing and buy a lot of belief, since a dormer or a
  gable-end window is visible from the street.
- **No exterior window glows.** Only the front door is lit (E1, E4, E6). The
  interior runs seven point lights; from the yard the house is a dark box with
  one warm door. A house with someone in it has lit windows, and this is a
  cheap, high-yield win: thin emissive quads in front of the exterior window
  positions, warm, at low intensity. It also pre-answers the "day/night" arc in
  the bible. Listed as an enhancement in §5, not a bug.
- The interior's dark night glazing (`glass` at `0.012, 0.022, 0.036`) is
  **physically correct** for a lit room at night and should not be "fixed."
  Warm from outside, dark from inside, is what a real window does.

---

## 3. Curated asset and reference recommendations

Ground rules applied: preserve the house silhouette, the navy/blue plus warm
accent palette and the night atmosphere; aim at realism inside a browser
Three.js budget. **Nothing was downloaded, bought, installed or imported.**
Where a figure is not published, it is marked `unknown` rather than guessed.

The budget these have to live inside: the yard is already 614 k triangles and
65 draw calls, the willow alone is 11.36 MB, and deploy is a Cloudflare Pages
static export.

### 3.1 A convincing weeping willow

**Recommended: author it in Blender rather than buy one.** Every ready-made
photoreal willow I found is 6–17× the triangle budget of the thing it would
replace, and would need more optimisation work than authoring costs — and the
project already has a working Blender-MCP authoring pipeline with frozen
inputs, manifests and hash checks.

| Option | Link | Price | Licence / attribution | Formats | Published size / polycount | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| **Sapling Tree Gen** (Blender add-on, ships with Blender; has a *Weeping Willow* preset) | [extensions.blender.org/add-ons/sapling-tree-gen](https://extensions.blender.org/add-ons/sapling-tree-gen/) | Free | GPL add-on; **generated geometry is your own work**, no attribution — *confirm on the extension page, my fetch was 403* | Blender curves → mesh → GLB | You choose the polycount | **Primary.** Only route that lets you hit a target budget and keep the existing silhouette |
| **Poly Haven — Bark Willow / Bark Willow 02** (trunk texture) | [bark_willow](https://polyhaven.com/a/bark_willow) · [bark_willow_02](https://polyhaven.com/a/bark_willow_02) | Free | **CC0** — no attribution, commercial and redistribution allowed ([licence](https://polyhaven.com/license)) | Blend, glTF, PBR maps to 8K | `bark_willow` 1 m @ 81.9 px/cm; `02` to 8K @ 38.1 px/cm; download size unknown | Pair with the above. Ship at 1K–2K, KTX2 |
| **ambientCG — Leaf Set 013 / 017 / 020** (frond cards) | [LeafSet017](https://ambientcg.com/view?id=LeafSet017) · [LeafSet013](https://ambientcg.com/view?id=LeafSet013) · [all leaf assets](https://ambientcg.com/list?q=leaf) | Free | **CC0** public domain, no attribution | PNG/JPG PBR + alpha atlases, 1K–8K | Per-asset; comparable ambientCG 4K-JPG sets run 55–85 MB, 1K far smaller | Willow needs long narrow fronds — check each set before committing; a hand-drawn frond card may still beat these |
| Sketchfab — "Weeping willow tree" by adam127 | [sketchfab.com/…/48c090ce](https://sketchfab.com/3d-models/weeping-willow-tree-48c090ce93d543cf8b19d3c6f2b6788a) | Free | **CC-BY 4.0 — attribution required** | not listed (`unknown`) | 144.3 k tris / 162 k verts, **no textures** (diffuse colours only) | **Reference only.** 1.4× the current tree's tris with no textures. Use for branch structure and droop proportions |
| Sketchfab Store — "Weeping Willow Tree #06" by meshshape | [sketchfab.com/…/ec62ab97](https://sketchfab.com/3d-models/weeping-willow-tree-06-ec62ab9750c7434489f49e9b2059bdbc) | `unknown` (store listing) | Royalty-free store licence + **NoAI** clause | `unknown` | **358.4 k tris / 403.2 k verts**; textures `unknown` | Not viable without aggressive LOD — 58 % of the entire current yard in one prop |
| iMeshh — "Willow Tree 02" | [imeshh.com/assets/willow-tree-02](https://imeshh.com/assets/willow-tree-02) | Paid plan; per-asset price `unknown` | Royalty-free commercial, no per-project fees | .blend + optimised glTF/GLB | **633,489 polys**, 7.34 × 7.28 × 7.59 m; textures and download size `unknown` | Confirms the pattern. Reference only |

**Optimisation work, whichever route:** target 15–25 k triangles with the crown
built from alpha-tested frond *cards* rather than modelled leaves, one 1K–2K
KTX2/Basis atlas, two LODs, and a vertex-colour wind mask so the existing
`useFrame` sway can move the fringe instead of rotating the whole object (which
is what it does today, and is why the tree reads as rigid).

**Also fix while you are in there:** scale. At 5.48 × 7.59 m against an 8.12 m
house it is undersized; a mature weeping willow is 10–20 m and broader than
tall. And correct the icy blue-white — the current cast reads as frost, not
foliage, against an otherwise navy scene.

### 3.2 Architectural materials for the existing house

`scripts/build-interior.cjs` already emits world-space UVs at 1 repeat per world
unit and named groups — `floor`, `wall`, `ceiling`, `stair`, `trim`, `glass`.
Tiling PBR can be swapped in per material name without touching a vertex, so
this is a drop-in job. Both sources below are **CC0, no attribution, commercial
use and redistribution allowed** — which matters for a static export where the
textures ship inside the bundle.

| Need | Candidate | Link | Price | Licence | Formats | Published size |
| --- | --- | --- | --- | --- | --- | --- |
| `floor` — oak boards (matches the existing `oak-grain-v002.png`) | ambientCG **Wood Floor 051** | [WoodFloor051](https://ambientcg.com/view?id=WoodFloor051) | Free | CC0 | JPG/PNG PBR, 1K–8K | 4K-JPG **57 MB**, 4K-PNG 174 MB |
| `floor` — alternate, wider board | ambientCG **Wood Floor 040** | [WoodFloor040](https://ambientcg.com/view?id=WoodFloor040) | Free | CC0 | JPG/PNG PBR, 1K–8K | 4K-JPG **72 MB**, 4K-PNG 203 MB |
| `stair` — oak treads | ambientCG **Wood 049** (oak) | [Wood049](https://ambientcg.com/view?id=Wood049) | Free | CC0 | JPG/PNG PBR, 1K–8K | 4K-JPG **83 MB**, 4K-PNG 214 MB |
| `wall` — pale plaster | ambientCG **Painted Plaster 017** | [PaintedPlaster017](https://ambientcg.com/view?id=PaintedPlaster017) | Free | CC0 | JPG/PNG PBR, 1K–8K | 4K-JPG **56 MB**, 4K-PNG 124 MB |
| `wall` — alternates | **Painted Plaster 003 / 007 / 010 / 018**, **Plaster 001 / 003** | [query: plaster](https://ambientcg.com/list?q=plaster) | Free | CC0 | as above | `unknown` per asset |
| `trim` + navy panelling — painted joinery | ambientCG painted-wood sets; Poly Haven painted-plaster/wood | [ambientcg.com](https://ambientcg.com/) · [polyhaven.com](https://polyhaven.com/) | Free | CC0 | JPG/PNG/EXR PBR + .blend + glTF | `unknown` per asset |
| Whole-library fallback | Poly Haven textures | [polyhaven.com](https://polyhaven.com/) | Free | **CC0**, attribution appreciated not required ([licence](https://polyhaven.com/license)) | Blend, glTF, PBR to 8K | per asset |

**Optimisation work.** Those 4K-JPG figures are *source* sizes and must not
reach the browser. Budget roughly: 1K for `trim` and `ceiling`, 2K for `floor`
and `wall`, everything KTX2/Basis-compressed, roughness+metal+AO packed into one
RGB texture, and one shared atlas per material group. Done that way the whole
interior surface pass should land in single-digit MB against the current 12,628
triangles. `STATUS.md` already flags "tens of MB if done carelessly" as the
risk — the mitigation is KTX2 and atlasing *from the first material*, not as a
cleanup.

**Exterior materials are a different problem.** `house-main-optimized.glb` is a
**single mesh with one baked-texture PBR material and two JPEGs** — there are no
separable `siding` / `trim` / `roof` groups to swap. Re-materialising the
exterior means re-authoring or re-UVing the model, not dropping in textures.
Worth knowing before anyone plans an "exterior material pass."

### 3.3 Minneapolis skyline — references and shippable assets

This section exists mostly to resolve **P1**. Ranked by how cleanly the result
can be shipped.

| Option | Link | Price | Licence / attribution | Formats | Size / detail | Ship or reference? |
| --- | --- | --- | --- | --- | --- | --- |
| **Render your own from OpenStreetMap** building footprints + heights | [osmfoundation.org — licence FAQ](https://osmfoundation.org/wiki/Licence/Licence_and_Legal_FAQ) · [attribution guidelines](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines) | Free | **ODbL.** A rendered image is a *Produced Work*: **attribution to OpenStreetMap required, share-alike NOT required** on the render. Only a derived *database* would carry share-alike | GeoJSON → Blender → PNG plate | You control resolution and massing accuracy | **Ship.** Cleanest legal answer, and you keep the palette |
| **Minnesota Geospatial Commons / MnGeo** — LiDAR-derived building footprints and 0.5 m DEM (2021–23, USGS QL1) | [gisdata.mn.gov](https://gisdata.mn.gov/) · [MnGeo LiDAR](https://mn.gov/mngeo/gis-data-and-maps/info-by-topic/elevation/lidar/index.jsp) · [building footprints metadata](https://mnatlas.org/metadata/buildings.html) | Free | Government open data; **per-dataset terms — verify each before use** (`unknown` until checked) | Shapefile, GeoJSON, GeoTIFF, KML, CSV; WMS/WFS | Statewide; downtown Minneapolis extract is small | **Ship**, once the specific dataset's terms are confirmed. Most accurate massing available |
| **Unsplash** photographs of the Minneapolis skyline | [unsplash.com/license](https://unsplash.com/license) | Free | Commercial use, **attribution appreciated not required**. Cannot sell unaltered; **no indemnification, no warranty**. *Note: the API terms DO require attribution — download manually, don't wire up the API* | JPEG | Photographer-dependent | **Ship with care.** Legally fine; the missing indemnity is the reason it is not first |
| **Wikimedia Commons** skyline photographs | [commons.wikimedia.org](https://commons.wikimedia.org/) | Free | **Varies per image** — PD, CC-BY, CC-BY-SA. A CC-BY-SA source would force the derived plate to CC-BY-SA | JPEG/PNG | varies | **Reference**, unless you find a PD or CC-BY image and record the credit |
| The existing `render-skyline-plate.py` Meshy-city pipeline | in-repo | — | Your own model | GLB → Blender → PNG | `unknown` | **Ship.** Already built and already loses on facade quality — but it is *yours*, and P1 makes that worth more than it did |

**On photographing buildings:** US copyright expressly permits pictorial
representations of architectural works that are visible from a public place
(17 U.S.C. § 120(a)), so the *buildings* are not the problem. The problem is the
**photographer's** copyright in the photograph — which is precisely what
`~/Downloads/skyline.png` has no record of.

**Optimisation work.** The plate is a single alpha-cut-out quad, so cost is
texture bytes, not geometry: 2K wide is plenty for a backdrop subtending ~10°,
KTX2-compressed, alpha retained. For eventual **interior window views**, do not
reuse the yard plate — parallax will break at close range. Either a small
equirectangular night panorama on a `THREE.Environment`-style backdrop, or one
plate per window orientation placed a few metres outside the glass. Whichever
you choose, the same asset can also drive the `Environment` reflections that
`STATUS.md` already lists as photoreal lever #3.

**Regardless of which you pick:** record source, licence, URL and date in the
repo — a `portfolio-assets/ATTRIBUTION.md` or a manifest beside each texture,
matching the discipline already applied to the Blender exports.

---

## 4. Walkthrough and usability findings

**Scope caveat:** the v002 interior was not walked (§0). Interior items are
INFERRED from layout data and build scripts. The exterior items are verified
live. Furniture absence is not reported. The 1.62 m / 65° camera is the
baseline and is not questioned.

### 4.1 Bugs

**B1 — Exit-to-yard lands inside the house collider.** See **P3**. Severity:
**medium**. Location: `lib/interior-layout.ts:782`. Repro and evidence in
`docs/audits/claude-house/OBSERVATION-LOG.md`. **[VERIFIED live]**

**B2 — `FOYER_ENTRY_POINT`'s Y value is dead and misleading.**
`lib/interior-layout.ts:712` still declares `[X0, 1.7, .65]`, but
`lib/player-store.ts:77` builds the teleport as
`[FOYER_ENTRY_POINT[0], INTERIOR_EYE_HEIGHT, FOYER_ENTRY_POINT[2]]` — the 1.7 is
never read. Behaviour is correct today; the risk is the next person changing
1.7 and seeing nothing happen. Severity: **cosmetic**. **[VERIFIED by reading]**

**B3 — Two code comments are wrong about direction.**
`lib/interior-layout.ts:783` says `YARD_EXIT_YAW = 0 // facing +Z, away from the
house`; yaw 0 in three.js looks down **−Z**, which *is* away from the house, so
the behaviour is right and the axis label is wrong. `lib/colliders.ts` says
"X negative = player's left (facing house from street)" — facing +Z, **+X** is
the player's left, which is also the driveway/garage side the same comment names
correctly one line later. Severity: **cosmetic**, but both are exactly the kind
of comment that misleads a future fix. **[VERIFIED: +X observed as the garage
side and on the viewer's left in E1/E3]**

### 4.2 Proportion and orientation

**W1 — The foyer is a 2.3 m wide, 3.0 m tall shaft.** [INFERRED] The Foyer spans
`CORE_MIN_X`→`CORE_MAX_X` — **2.30 m wide**, 6.30 m deep, ceiling 3.00 m. Its
height-to-width ratio is **1.30 : 1**: the first space the player occupies is
taller than it is wide, and four times longer than it is wide. Arrival puts them
at z = 0.65 facing +Z, with the foot of the first flight (`CORE_Z0` = 2.60) a
little under 2 m ahead.

This is my best single explanation for "the 1.62 m / 65° camera is vastly better
but scale still feels slightly odd." The camera fix was correct; the first room
is a corridor with a 3 m ceiling, and a corridor that tall reads as a shaft
whatever the camera does. It also collides with the exterior promise — outside,
a projecting gabled porch with a grand arched door; inside, immediately, a
2.3 m passage.

I am **not** proposing a plan change; `CORE_WIDTH = 2.3` is load-bearing and
circulation has already failed here once. Two non-architectural levers worth
testing first, in this order: (a) raise the trim/wall contrast (§2.3) so the
skirting and architraves actually read and give the eye scale; (b) try the
ceiling in the foyer *only* at 2.7–2.8 — a lower ceiling in a narrow entry is
correct residential practice and makes the rooms it opens onto feel larger by
contrast. Judge (a) before touching (b).

**W2 — One sconce flanks a symmetrical arched door.** [INFERRED]
`SHELL_PRACTICALS` places the foyer fixture at x = 299.33, which is in the 0.55 m
strip *west* of the 1.20 m centred door opening. There is no counterpart east.
An arch is a symmetry cue; lighting it from one side undercuts it, and the exit
prompt asks the player to turn back and look at exactly this wall. Severity:
**subjective**. If a second fixture cannot have a light-pool slot, an unlit twin
still fixes the symmetry — the pool cost is in the `pointLight`, not the mesh.

**W3 — Client Room panelling runs on the two walls it makes least sense on.**
[INFERRED] `build-shell-details-v002.py` applies the dado only when
`side in ['north','east']` — the back wall and the outer east wall. The **south
wall carrying both front windows gets none**, and neither does the west wall you
enter through. Wainscot conventionally runs *under* windows; here it does the
opposite. Two panelled walls out of four reads as unfinished rather than
designed, and it is the first thing you see on entering the room from the foyer.

### 4.3 The "hospital-like" navy panelling — evaluation only

Evaluated as asked, **not redesigned**. The user's note is specifically about the
navy lower-wall panelling; the ivory trim is approved and is not in question.
All measurements from `scripts/build-shell-details-v002.py`. **[Now VERIFIED
live — see the confirmation note after the table.]**

Geometry as built, in the Client Room only:

| Element | Height above floor | Size |
| --- | --- | --- |
| Skirting cap | 0.130 | 25 mm tall × 32 mm deep |
| Panel lower rail | 0.190 | 65 mm |
| Panel field | 0.155 – 0.765 | **12 mm proud** |
| Stiles | 0.220 – 0.710 | 54 mm wide, 26 mm deep, ~0.9 m apart |
| Panel top rail | 0.745 | 65 mm |
| Chair rail cap | 0.783 – 0.818 | **35 mm tall × 43 mm deep** |

**Confirmed on screen, and the diagnosis holds.** From the foyer doorway at
`('ground', 300.6, 1.4, yaw −π/2)` the east wall's panelling reads as a **flat
dark navy stripe with a thin light cap** — at normal viewing distance the stiles
are not visible at all, and no panel field shadow reads. It is only from close
up, in the straight-on view at `('ground', 303.8, 4.2)`, that the panel
divisions become apparent. That is the failure mode reason (1) predicts: a 12 mm
proud reveal has no shadow to read by, so the joinery collapses into paint.

The straight-on view also confirms **W3** unambiguously: the navy band runs
along the east wall, reaches the corner, and simply **stops** — the front wall
carrying both windows continues in plain plaster. The termination is plainly
visible and reads as unfinished rather than as a design decision.

Five specific reasons this reads institutional rather than domestic. Each is
independent, so they can be tested separately:

1. **The reveal is 12 mm and proud, not recessed.** Real panelling reads through
   the *shadow* in a recessed field. A 12 mm raised panel under soft night
   lighting collapses to a flat painted band — which is exactly what a
   corridor bumper rail is.
2. **The chair rail cap is 35 mm tall and projects 43 mm.** Too slight to throw
   a shadow line. A domestic chair rail is roughly 50–70 mm with a moulded
   profile; a thin flat cap on a flat band is the institutional signature.
3. **The panels are landscape.** Field 0.49 m tall between stiles ~0.85 m apart
   — about **1.7 : 1 wide**. Traditional wainscot panels are square or portrait.
   Landscape panels at low height read as wall protection.
4. **The rail sits at 0.82 m.** Low. Domestic chair rails typically land
   0.85–1.05 m. Under a 3.00 m ceiling this is **27 % of wall height**, which
   makes the band read as a stripe applied to a tall wall rather than as the
   base of a designed elevation.
5. **The contrast is maximal at the horizontal.** `#3c4b5a` against a
   `#c7c6c1` wall, meeting at a dead-straight unbroken line at a constant height
   — the single most recognisable visual of an institutional corridor. And per
   §2.3 the *trim* is only ~17 % lighter than the wall, so the dado line is the
   strongest edge in the room by a wide margin.

If exactly one thing changes, make it **(1)** — recess the field 15–20 mm
instead of raising it 12 mm. That is a sign change in one script constant, it
does not alter the design, and it converts a painted stripe into joinery.
**(2)** is the cheap second. **(3)–(5)** are design decisions and belong to the
user, not to this audit.

### 4.4 The walkthrough — what actually holds up [ALL VERIFIED live]

This section replaces the "not assessed" placeholder from the first pass.

**What is genuinely good, and should not be touched:**

- **The staircase reads as real joinery.** Oak treads, painted risers, slender
  black metal balusters seated on each tread, oak handrail. Best seen at
  `('second', 300.9, 3.6)`, which lands you on the flight itself.
  *I nearly filed a false bug here.* From the foyer at
  `('ground', 300, 2.0, yaw π)` the lower flight appears to have no balusters at
  all — the newel post and outer string sit directly in front of them at that
  angle and hide the lot. A raking view from `('ground', 301.0, 2.2)` shows them
  clearly. Worth recording because that first view is the one every arriving
  player gets, and "the stair looks like it's missing its balusters" is a
  reasonable thing for a visitor to think.
- **The attic is the best space in the house.** Oak rafters and collar ties over
  a plastered roof plane, knee walls, a centred gable window, and the stairwell
  ringed by guards that read as a proper gallery rail rather than a fence. The
  attic-guard work is vindicated. `('attic', 300, 3.0)` and `('attic', 300, 1.9)`.
- **The window joinery** — see the P2 correction. Inset sash, 2 × 2 lights,
  meeting rail, lifts, reveal liner, projecting sill and apron.
- **The arched front door from inside** is convincing: dark leaf, ivory arched
  casing, brass lever, deadbolt and three hinge knuckles, hinged left as viewed
  from inside.
- **No console errors.** The entire walkthrough produced exactly two, both the
  in-app browser refusing pointer lock (`WrongDocumentError`). That is the
  harness, not the app. No shader warnings, no GLTF failures, no NaN spam.
- **No clipping, floating geometry, gaps, z-fighting or collision mismatch was
  observed** anywhere across all four storeys. The push-out at `x = 300.9 →
  300.73` on the stair is the centre collision strip doing its job.

**Bugs and defects found:**

- **Light streaks on the Library floor** — promoted to **P1**.
- **Exit-to-yard push-out** — **P3**, now verified end-to-end.
- **A specular blob on the night glass.** At `('second', 295.0, 2.0)` the upper
  right pane carries a soft bright smudge — a point light reflecting in glass
  that is meant to read as flat dark night glazing. Minor, but it draws the eye
  because it is the brightest thing on that wall. Severity: **cosmetic**.

**Subjective, and the honest surprises:**

- **The foyer is better than its numbers.** W1 predicted a 2.3 m shaft, and the
  measurements are right, but at 1.62 m / 65° it reads as a normal entry hall:
  oak floor, doorway either side, arched door behind, stair ahead. I would
  **not** act on W1's ceiling suggestion now. The proportion complaint is real
  but mild, and P2's blank wall band is the better explanation for the residual
  odd scale.
- **The foyer sconce is the wrong object.** W2 predicted the asymmetry and it is
  visible, but the bigger issue is the fixture itself: a large plain opal box
  that reads modern against a traditional arched door, mounted high, blowing a
  hot spot onto the plaster beside it. Severity: **subjective**.
- **There is a hard fidelity cliff at the Client Room door.** The v002 detail
  pass covers the foyer and Client Room only — that is by design and documented.
  But walking from the Client Room (oak boards, dado, stepped cornice, wall
  fixtures) into the Library (flat grey-brown floor, bare plaster, skirting and
  window casing and nothing else) is a visible drop, and it is the *undetailed*
  rooms where P2's blank wall above each window is most exposed. Not a defect —
  but it means judging "does the shell feel believable" from the Client Room
  alone will flatter the house.
- **The floor in the detailed rooms is a strong red-brown**, noticeably more
  saturated than "smoked oak" suggests, and currently the loudest colour in the
  house against the pale plaster. Worth a look next to the navy.
- **The panelling reads exactly as the user described it** — see §4.3, now
  verified.

---

## 5. Future enhancements (not defects)

These are opportunities, deliberately separated from the findings above.

1. **Lit exterior windows.** Thin warm emissive quads at the exterior window
   positions. Highest ratio of belief to effort in the whole project, and it
   sets up the bible's day/night arc. (§2.4)
2. **A transom over the front door.** `STATUS.md` already flags this as blocked
   on the generator not cutting door headers. The exterior's arched porch makes
   it more wanted, not less.
3. **An exterior attic cue.** A dormer or gable-end window so the attic exists
   from the street before the player finds it inside.
4. **Vertical gradient on the interior panes.** Already noted in `STATUS.md` as
   belonging to the surface pass; the KTX2 atlas work in §3.2 is the moment.
5. **Willow wind.** `willow-tree-model.tsx` rotates the whole group by
   ±0.02 rad, which moves the trunk with the crown. A vertex-colour mask driving
   only the fringe would make the same 11 MB read far better — or come free with
   the rebuilt tree in §3.1.
6. **The Touch Grass sign is a blank cream board** (`0.55 × 0.22`, `#f5e6c8`, no
   text) with emissive neon-green blades under it. Visible from the front walk
   as a floating white rectangle (E4, E7). Fine as a placeholder — flagging it
   because it is the most placeholder-looking object in an otherwise composed
   yard. **[VERIFIED]**

---

## 5b. Exterior roadmap — for later, not now

_Requested explicitly: not current work, a roadmap for when the exterior comes
up. Ordered by value per unit of effort, not by how much fun it is._

**The constraint that shapes all of this:** `house-main-optimized.glb` is a
**single mesh with one baked-texture PBR material and two JPEGs**, 60,000
triangles, 6.77 MB. There are no separable `siding` / `trim` / `roof` / `glass`
groups. So anything that means "change a material on part of the house" is
really "re-author or re-UV the model," while anything that means "add an object
in front of the house" is cheap. That split is what the ordering below follows.

### Tier 1 — cheap, additive, no touching the GLB

1. **Lit windows.** Thin warm emissive quads placed just outside each window
   opening. The house is currently a dark box with one glowing door while seven
   lights burn inside it. This is the single biggest "someone lives here" win
   available and it costs a handful of quads and no light-pool slots. It also
   pre-answers the bible's day/night arc.
2. **A porch light that reads as a fixture.** The entry is lit by a bare
   `pointLight`; there is no lamp object. A small modelled lantern beside the
   arch would tie the exterior to the interior sconce vocabulary.
3. **Ground the house.** There is no visible foundation course, plinth or grade
   transition — the walls meet the ground abruptly. A low plinth band and a
   planting/mulch strip along the base would fix the "model sitting on a plane"
   read for very little.
4. **Retire the blank Touch-Grass sign** or put art on it (§5.6). It is the most
   placeholder-looking object in an otherwise composed yard.

### Tier 2 — the two things that actually change how the exterior reads

5. **Replace the willow.** P5 and §3.1. 100k triangles and 11.36 MB for an
   object that does not survive being walked up to, undersized at 5.5 × 7.6 m
   against an 8.12 m house, and frost-blue rather than foliage. Rebuild in
   Blender at 15–25 k with CC0 bark and frond atlases. Recovers ~11 MB of a
   budget the deploy target actually cares about.
6. **Give the attic a presence from the street.** A gable end or a pair of
   dormers on the front slope. This is the cheap side of the §2.4b ridge
   mismatch: fixing it on the exterior reconciles the roof *and* explains the
   attic to a visitor who has not been inside yet. Fixing it on the interior
   means re-cutting the attic and moving both windows.

### Tier 3 — needs the model re-authored, so plan it as one job

7. **Split the mesh into material groups** — siding, trim, roof, glazing,
   masonry. Everything below depends on this, and doing it once is much cheaper
   than doing it per-feature. This is also the moment to decide whether the
   exterior stays Meshy-derived or gets rebuilt.
8. **Resolve the blue/light inversion** (§2.3). Outside, blue is the *bright*
   trim on a dark body; inside, blue is the *dark* dado under a light wall. One
   cheap reconciliation: put the exterior's blue on the interior sashes and the
   front-door casing, so blue becomes the "opening" colour on both sides. That
   half is an interior change and could happen sooner.
9. **PBR materials on the exterior**, once (7) exists — §3.2 lists CC0 sources.
   Note the exterior is the *heavy* scene (614k tris, a 2048 shadow map
   re-rendering all of it every frame), so this wants a texture budget set
   before it starts, not after.
10. **The garage decision** (P4), if it is resolved by *removing* the garage
    rather than by adding a locked interior door. Listed last because it is the
    most invasive and the least necessary — the joke carries it.

### Explicitly not recommended

- **Do not chase exterior/interior geometric parity.** The separation is
  deliberate and load-bearing (the interior is 1.21× the exterior footprint and
  the docs are clear that the measurement was "accurate and completely
  irrelevant"). Everything above is about *recognisability* — same house, same
  language — not about making the shells match.
- **Do not raise exterior fidelity to meet the interior before the interior is
  finished.** `STATUS.md` already flags that the gap will widen and that the
  choice is to raise the exterior later *or* lean into the transition. That
  decision wants the finished interior in front of it.

## 6. Remaining uncertainties, and suggested next actions for Codex

### Uncertainties I could not resolve

1. ~~The whole v002 interior is unseen~~ — **resolved.** The house was walked on
   a live 3017 server; §2, §4.2, §4.3 and §4.4 are now observations, and the two
   inferences that turned out wrong are corrected in place. What remains
   unverified: **camera pitch could not be driven**, so nothing here rests on
   looking up at a ceiling or down at a floor from directly above — doorway
   head-height clearance in particular was judged from level views only, and the
   existing regression suite covers it better than I could by eye. Basement
   window wells sit at 2.25–2.75 m above the basement floor, i.e. above a level
   sightline, and were not seen.
2. ~~Which skyline pipeline is actually live~~ — **resolved from git history, see
   P1.** The photo pipeline is live; the "our own render" comment in
   `skyline-plate.tsx` is stale from `3983ed3` and predates the `f8ace9b`
   revert by 27 minutes. What remains unknown is the **provenance of
   `~/Downloads/skyline.png`** (commit `f8ace9b` calls it a "stock photo", so a
   licence probably exists) and of
   `minneapolis-skyline-cinematic.png`. Only the user can supply those.
3. **The exterior door's hinge side**, and whether the exterior door has any
   modelled hardware to match at all — it is a baked texture on a single mesh.
4. **The exterior's habitable width excluding the garage** — estimated at ~7.5 m
   from screenshots, not measured. Measuring it would need the mesh split or a
   raycast pass over the front face.
5. **Sapling Tree Gen's exact current licence terms** — the extensions page
   returned HTTP 403 to my fetch. My understanding (GPL add-on, generated
   geometry unencumbered) is standard for bundled Blender add-ons but was not
   confirmed from source.
6. **Per-dataset terms on the Minnesota Geospatial Commons** building data.
   Government open data, but the licence is declared per dataset.

### Suggested next actions, ranked

_Re-ranked after the walkthrough._

1. **Chase the Library floor light streaks.** (P1) The only newly-found bug, in
   a room the bible locks as portfolio-bearing, and the artefact most likely to
   read as "unfinished game." Try `shadow-normalBias` and a tighter key-light
   shadow frustum first.
2. **Move `YARD_EXIT_POINT` to z ≈ −5.1.** (P3) One number, verified repro,
   verified fix condition, now confirmed end-to-end on v002.
3. **Recess the panel field instead of raising it** in
   `build-shell-details-v002.py`. (§4.3) One sign change; converts a painted
   stripe into joinery without redesigning anything. Now visually confirmed as
   the reason the dado reads as a stripe.
4. **The window pass** — head to ~2.40, widths to 0.9–1.1. (P2) The largest
   consistency win available, and **cheaper than first thought**: the muntins
   already exist, so this is one constant plus a regeneration of the four floor
   GLBs. Re-run `npm run elevations` after.
5. **Decide the garage question** before furnishing the ground floor. (P4) A
   locked "Garage" door off the Mudroom is one `DoorDef` and settles it.
6. **Rebuild the willow in Blender** at 15–25 k triangles with CC0 bark and
   frond atlases. (P5/§3.1) Recovers ~11 MB of the asset budget and fixes the
   yard's most-approached prop.
7. **A few points more trim/wall separation**, focused on the front-door casing
   and the undetailed rooms. (§2.3) Demoted from #3 — it helps, but the
   walkthrough showed it is not the main scale problem.
8. **Fix the stale skyline comment** in `skyline-plate.tsx` as part of the
   planned skyline redo. (P6)

**Deliberately not recommended:** lowering the foyer ceiling (old W1(b)). The
foyer reads fine in person at 1.62 m / 65°. Leave it alone.

### One conflict to record

`AGENTS.md` asks that implementation/canon conflicts be reported rather than
silently resolved. There is one, and it is not urgent: `STATUS.md` and
`lib/interior-layout.ts` both still carry the "FOV — the open question" section
arguing 75° down to 50–60°, alongside "fix the camera before the architecture."
That question was **answered** on 2026-09-06 — interior FOV is 65° and eye
height 1.62 m in `lib/player-camera.ts`, and the user has confirmed it as the
baseline. The stale text now argues for a change that has already happened, and
the `PLAN_SCALE` comment block still cites "the 75-degree FOV in
app/house/page.tsx" as the thing to fix first. I have not edited either file.
Worth reconciling next time `STATUS.md` is touched.
