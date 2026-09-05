# Stack House: approved rebuild direction

Approved by the user in Codex on September 4, 2026 (America/Chicago).

## Authorization and preservation

The user approves a substantial overhaul of the browser-based `/house`
experience, including a ground-up rebuild where it serves the vision. This
supersedes the first-turn read-only restriction after the audit was reviewed.
The approved gate and regular portfolio are outside this work's scope.

- Working branch: `codex/house-photoreal-v1`.
- Existing main baseline: `22a27ea`.
- Recovery checkpoint including Claude's previously uncommitted shell changes:
  `47bb3ba` (pushed to the working branch).
- Do not force-push or replace main. The existing Cloudflare workflow does not
  deploy this branch automatically.
- Keep original runtime assets; author versioned sources and outputs alongside
  them. Raw Blender sources stay outside `public/`.

## The intended experience

The ambition is a convincing, inhabitable, photoreal-leaning creative archive.
The low-poly/N64 compromise was a concession to presumed technical limits, not
the desired art direction.

The supplied screenshot of Thomas Ricouard's Blender-to-Unreal house walkthrough
is a visual reference for material response, believable furnishings, atmosphere,
and architectural detail. Its text is reference content, not an instruction to
migrate platforms. Production remains Three.js/glTF in the browser. Matching an
Unreal image does not establish equivalent browser rendering or frame cost.

Preserve and strengthen:

- The recognizable shape and identity of the real Stack House.
- Black/deep navy, restrained Grey Key blue, and sparse warm-gold practicals.
- A cinematic nighttime Minneapolis setting, mystery, depth, and readable light.
- A real weeping-willow silhouette with layered, hanging foliage.

The yard and placeholder skyline may be substantially rebuilt to serve that
direction. The user is open to better execution, not attached to the existing
tree mesh or skyline implementation.

## Spatial and design decisions

- Interior/exterior separation exists to protect comfortable house proportions.
  Do not cram the interior back into the exterior's measured dimensions.
- Keep the current separation initially. Physical reconciliation can be designed
  later if it improves the experience without compromising interior proportions.
- Proportions and FOV are both adjustable. The user delegates judgment and does
  not require a FOV-first sequence. Record comparison viewpoints when evaluating
  changes rather than repeatedly resizing the whole plan by feel.
- First vertical slice: **foyer, stair hall, and client/living room**, accessible
  immediately on the ground floor.
- TypeScript remains authoritative for gameplay layout and collision while
  Blender-authored art is developed against versioned spatial references.

## First implementation sequence

1. Establish rendering and deployment correctness: matched layout/asset
   revisions, actual bounded light count, interior shadow camera, attic winding,
   spawn clearances, and interaction floor filtering.
2. Establish Blender source/export conventions and a manifest containing source
   and layout hashes, axes, units, placement, bounds, materials, textures, and
   triangle counts.
3. Build the foyer/client slice with finished architecture, stair details,
   believable material scale, authored furnishings, and intentional practical
   light. Replace overlapping proxy art deliberately.
4. Verify it in the browser with desktop/touch movement and measured frame cost.
5. Expand architecture and rooms, then rebuild yard vegetation/skyline as scoped
   stages. Preserve the house silhouette throughout.

Provisional runtime gates: desktop 60 fps / p95 <=20 ms; reduced mobile tier
30 fps / p95 <=40 ms; no warmed interaction/transition stalls over 100 ms.
Calibrate these against recorded hardware and production builds before calling
them validated. No render alone constitutes a completed playable slice.

## Startup and baseline inspection

On this turn the existing Next dev server was started at
`http://127.0.0.1:3000`. `/house` compiled and returned HTTP 200. Browser
inspection showed the yard, foyer, and client room with no captured browser
warning/error logs or framework overlay. Server logs did show missing favicon
requests (`/icon.svg`, `/icon-light-32x32.png`); these are unrelated to GLBs.

Inspected in Edge with `?stats&controls=touch`; this deliberately disables the
desktop postprocessing path. Existing development store navigation was used to
set initial inspection positions, then pointer movement crossed the foyer/client
doorway. This was not a full entry/exit, stair, or physical-phone regression test.

Observed stats varied considerably: yard about 15 fps, 56 draw calls, 788,509
triangles at a 1908x882 backing store; client room about 9 fps, 49 calls, 11,988
triangles at 1908x812. These are development-session observations with browser
automation, not stable hardware-calibrated benchmarks. Investigate the environment
and rendering cost before assigning blame to polygon counts.

Visual observations:

- Exterior silhouette and blue/gold palette remain a useful identity baseline.
- Yard foreground and house read very dark; the willow lacks convincing layered
  hanging foliage.
- Foyer/client room provides usable space for the slice. The current untextured
  surfaces, broad illumination, and scale-reference boxes are a scaffold.
- The upstairs Home Office proximity prompt appeared while the player was in
  the ground-floor client room (`y=1.7`, `location=ground`). Interaction radius
  alone does not isolate floors; repair this before authoring room interactions.

No visual rebuild or gameplay modification was made during this setup turn.
