# Foyer/client shell and attic guards — v002

Preview: `http://127.0.0.1:3017/house?architecture=v002&controls=desktop`.
Use `controls=touch` for touch navigation, including the in-app browser.
The earlier v001 room treatment remains selectable. Original production assets
and main are preserved; this work belongs to `codex/house-photoreal-v1`.

## Changes

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

`scripts/build-shell-details-v002.py` authors a separate Blender scene. Execute
through Blender MCP with `__file__` set to the script path; it refuses to replace
an existing named scene without deliberate inspection/removal. Its frozen inputs
are `portfolio-assets/stack-house/blender/rooms-v002.json`; compare those inputs
with the layout and architecture-details module before a new revision.

The adjacent `shell-details-v002.blend`, `oak-grain-v002.png`, and manifest are
committed source assets. The manifest records source/layout hashes, placement,
bounds, triangles and byte sizes. Source was saved and verified not dirty before
closing Blender to release memory during the pause.

- `attic-guards-v002.glb`: 12,420 triangles, two primitives, 989,628 bytes.
- `foyer-client-details-v002.glb`: 25,272 triangles, five primitives, 1,799,636 bytes.
- Both embed their oak texture; no external runtime image dependency.
- Candidate shell generation: transpile the layout as for v001, then run
  `node scripts/build-interior.cjs --candidate-v002`. Stair art remains v001.

## Verification and limits

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
