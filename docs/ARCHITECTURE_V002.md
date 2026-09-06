# Foyer/client shell and attic guards — v002

Preview: `http://127.0.0.1:3017/house?architecture=v002&controls=desktop`.
Use `controls=touch` for touch navigation, including the in-app browser.
The earlier v001 room treatment remains selectable. Original production assets
and main are preserved; this work belongs to `codex/house-photoreal-v1`.

The approved v002 shell is now the default for plain `/house` on this branch.
Use `architecture=legacy` for the original procedural shell, or `architecture=v001`
for the earlier staircase preview. Control selection remains independent.

## Changes

- Added a closed, panelled deep-blue interior front door with ivory frame, brass
  lever, deadbolt, hinge knuckles and threshold. Art dimensions and collision
  derive from `ENTRY_DOOR` in `lib/architecture-details.ts`. The existing E/USE
  interaction still performs the yard transition; this pass adds no swing animation.
  The model appears in all branch shell variants to match shared collision.

- Blender-authored oak boards with an embedded grain texture, low ink-blue
  client-room panelling, skirting caps, doorway plinths and architraves, recessed
  jamb linings, and a stepped client-room ceiling cornice.
- Three brass/opal wall fixtures with mounting arms. Their runtime lights use
  the existing seven-slot pool, replacing the generic foyer/client centre lights.
- Pale plaster and coordinated ivory trim; reduced interior ambient-occlusion
  radius/intensity avoids heavy black borders around small mouldings.
- Room markers and the green exit light are suppressed in v002. The home-office
  interaction and exit interaction now respect their floor.
- Attic guards follow shared centrelines in `lib/architecture-details.ts`.
  The east-front stair arrival stays open. Additional guard colliders stop
  applying below the attic slab, because floor identity stays attic through
  both descending flights. Guards are shown in all shell variants on this
  branch so these shared collision changes always have corresponding art.

## Sources and exports

Entrance source: `scripts/build-entry-door-v002.py`, with frozen dimensions and
editable `.blend` under `portfolio-assets/stack-house/blender/entry-door-v002.*`.
The manifest records source/input hashes, bounds and placement. The GLB contains
9,488 triangles in six material primitives, 478,996 bytes, and no textures.
Blender was saved and closed after export to release memory.

`scripts/build-shell-details-v002.py` authors a separate Blender scene. Execute
through Blender MCP with `__file__` set to the script path; it refuses to replace
an existing named scene without deliberate inspection/removal. Its frozen inputs
are `portfolio-assets/stack-house/blender/rooms-v002.json`; compare those inputs
with the layout and architecture-details module before a new revision.

The adjacent `shell-details-v002.blend`, `oak-grain-v002.png`, and manifest are
committed source assets. The manifest records source/layout hashes, placement,
bounds, triangles and byte sizes. Source was saved and verified not dirty before
closing Blender to release memory during the pause.

- `attic-guards-v002.glb`: 12,420 triangles, two primitives, 989,616 bytes.
- `foyer-client-details-v002.glb`: 24,516 triangles, five primitives, 1,761,704 bytes.
- Both embed their oak texture; no external runtime image dependency.
- Candidate shell generation: transpile the layout as for v001, then run
  `node scripts/build-interior.cjs --candidate-v002`. Stair art is v002; the earlier v001 preview retains v001.

## Verification and limits

Entrance follow-up: TypeScript and the extended architecture checks pass. The
closed leaf blocks forward walking while leaving the exit interaction in reach;
a raycast verifies the model face agrees with the collider. Live browser USE
exited to the yard, then USE at the exterior door returned to ground at
`[300, 1.7, 2.38]`, clear of the new door. Foyer proportions/hardware were visually
inspected. The full stair/guard regressions still pass.

Follow-up correction: the user identified a projecting floor/ceiling strip between
the stair flights. Separate rectangular cuts left the 20 cm centre gap filled.
Candidate shell generation now cuts one bounding opening per switchback, including
that gap. Regression raycasts check three positions in each affected floor and
ceiling; they reproduced the old failure and pass after regeneration. Basement
closure and all six stair traversals still pass. Original/v001 assets are retained.

TypeScript passes. `node scripts/check-architecture-v001.mjs` checks the original
18 treads/landing, basement closure, attic winding, all six stair traversals, and
now all four attic guard collisions plus their removal below the slab. All pass.
Export triangle/byte counts and the saved Blender hash match the v002 manifest.

Desktop and touch visual inspections covered the client room, doorway and attic
guards. After reboot, a live touch drag moved from x=302.1 to x=300.857 at z=1.4,
crossing the client/foyer doorway at eye height 1.7; movement was released and
reported zero input. This is not a full physical-phone regression test. The
in-app browser rejected pointer lock, so a live desktop WASD traversal remains
unverified there; the shared movement function passes the simulated routes.

Memory-allocation failures interrupted the first final-check attempt while other
tools were active. After the user rebooted, the isolated server compiled `/house`
and served HTTP 200. Existing favicon 404s remain. Earlier Edge shader compiler
warnings (precision/derivatives) are not claimed fixed. No production performance
benchmark or deployment was performed. This is an unfurnished shell stage;
window scenery, broader lighting optimization and the rest of the house remain.


## Entrance shape correction

The exterior reference has a rounded arch, two tall glazed panes and two lower panels. Door v002 follows that layout and narrower proportions, replacing the initial rectangular six-panel interpretation. The v002 shell and detail builder omit their square entrance trim; the door asset supplies arched ivory casing and plaster infill. Glazing is dark for the night view from inside. Exterior masonry remains unchanged. TypeScript, stair/collision checks, two-pane ray checks and an in-browser interior visual inspection pass. The old door source remains available for rollback.


## Stair joinery follow-up — 2026-09-06

The v002 shell now uses staircase-v002.glb (14,540 triangles, three material primitives). Its separate build-staircase-v002.py and editable Blender source retain the frozen layout-v001.json dimensions. Two balusters per tread replace the sparse original spacing; each starts on the horizontal tread surface and meets the sloping handrail. A short oak return joins the rails at the half landing within the existing centre collision strip. v001 remains selectable and retains its original staircase.

Verification: 36 baluster ray samples, landing-return continuity, 19 tread/landing samples, all six traversal routes, doorway/attic guard regressions, and TypeScript pass. Upper stair hall, attic opening and landing were inspected in the browser. No furniture or floor-plan changes.


