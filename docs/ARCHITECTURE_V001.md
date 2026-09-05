# Architecture candidate v001

September 5, 2026. Work on `codex/house-photoreal-v1`; original GLBs retained.

Preview: `/house?architecture=v001&controls=desktop` (or `controls=touch`).
Current local server: `http://127.0.0.1:3017`. Without the architecture query,
the original shell remains available. The candidate hides ground-floor scale
reference furniture so the architecture can be reviewed unfurnished.

## Implemented

- Blender-authored switchback: smoked-oak PBR treads with bevelled nosings,
  closed painted risers, continuous sloping soffits, painted skirts, oak newels
  and handrails, steel balusters, finished half-landing fascia.
- Shared staircase cloned across basement, ground, and second floor. Three
  material primitives, 11,344 triangles per staircase, no textures yet.
- Candidate procedural shells omit old stair proxies. Basement floor closes
  the shaft bottom while preserving the opening in the ceiling.
- Candidate attic extrusion winding now agrees with its normals.
- Interior directional light targets the interior; orthographic shadow bounds
  are camera-local. The yard target is restored on exit.

Source: `portfolio-assets/stack-house/blender/staircase-v001.blend`. The adjacent
manifest records units, placement, layout/source hashes, bounds, and materials.
The separate Blender scene preserves editable objects. Export uses temporary
evaluated copies joined to one mesh and explicitly restricts export to the active
scene, avoiding Blender's default cube in another scene.

## Reproduction

The committed `layout-v001.json` is the frozen spatial input. Check its values
against `lib/interior-layout.ts` before authoring a new revision. To regenerate
candidate shells, transpile the layout using the first command from
`build:interior`, then run `node scripts/build-interior.cjs --candidate-v001`.
Do not run the entire legacy build command to create candidate assets: that
command intentionally writes the original asset names.

Run `scripts/build-staircase-v001.py` in Blender with its `__file__` set to that
script's absolute path. Through MCP, use an execution namespace containing
`__file__`, execute the compiled script there, and return its `result` dictionary.
The script refuses to replace an existing candidate scene. Inspect it before
deliberately removing/rebuilding that named scene. Source saves stay outside
`public/`; versioned GLBs stay under `public/models/`.

## Verification

- `npx tsc --noEmit --incremental false`: passed.
- `node scripts/check-architecture-v001.mjs`: passed. Raycasts verify 18 tread
  heights and the landing; basement floor is closed; zero attic faces oppose
  their normals. All three switchbacks pass up and down with `stepPlayer`, at
  60 Hz and 2 m/s, with no refused steps or incorrect final floor/height.
- Browser: desktop foyer and touch foyer/half-landing inspected in Edge. These
  are positioned visual inspections, supplemented by movement simulation; not
  a full manual WASD/physical-phone walkthrough.
- Original tracked GLBs have no diff. Candidate URLs are deployment-local,
  rather than fetching new asset names from GitHub main.

## Still unfinished

This is the first stair geometry checkpoint, not the completed photoreal shell.
Attic shaft guards and their collision correspondence, wall/window/door detailing,
wood textures and UV review, foyer/client finishes, and deliberate lighting remain.
The existing lights create visible hotspots. One captured WebGL shader warning
reported precision loss/division by zero; investigate light/shader inputs during
the bounded-light pass. No frame-rate target or production build was validated.
The candidate route still inherits the original asset preloads and floor mounting
strategy; it is a review path, not a streaming optimization.
