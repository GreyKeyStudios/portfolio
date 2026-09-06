# Stack House Project Architecture

## Route map

| Route | Purpose | Primary files |
| --- | --- | --- |
| `/` | Gate between the regular portfolio and Stack House | `app/page.tsx`, `app/gate.css`, `components/gate-scene.tsx` |
| `/portfolio` | Scroll-based portfolio exhibition | `app/portfolio/page.tsx`, `app/portfolio/portfolio.css`, `app/portfolio/music-identities.tsx`, `lib/portfolio-projects.ts` |
| `/house` | First-person interactive Stack House | `app/house/page.tsx` |
| `/projects` | Planned recruiter-friendly project library | Not implemented yet |

## Product layers

- **Gate** — two paths into the same body of work.
- **Homepage exhibition** — curated, cinematic storytelling.
- **Project library** — planned conventional index.
- **Project pages** — planned evidence/case studies.
- **Stack House** — separate 3D exploration using some shared project content.

The portfolio data registry and the house's Home Office data are currently
separate:

- `lib/portfolio-projects.ts` — canonical regular-portfolio content registry.
- `lib/projects-data.ts` — legacy/house-specific Home Office source.

Do not merge them casually. A future unification needs an explicit migration
plan because the two consumers have different assumptions.

## House dependency map

`app/house/page.tsx` owns the Canvas and orchestrates:

- boot/loading and responsive control selection;
- yard versus interior visibility;
- active and adjacent floor rendering;
- lighting pool and environmental effects;
- front-door/exit interactions;
- player state and proximity UI;
- terminal/Home Office overlays.

### Exterior

- `components/house-model.tsx`
- `public/models/house-main-optimized.glb`
- `components/yard-ground.tsx`
- `components/curb-and-sidewalk.tsx`
- `components/perimeter-fence.tsx`
- `components/street-lamp.tsx`
- `components/yard-bushes.tsx`
- `components/yard-grass.tsx`
- `components/willow-tree-model.tsx`
- `components/skyline-plate.tsx`
- `components/sky-dome.tsx`
- `components/neighbor-street.tsx`

### Interior visible geometry

- `lib/interior-layout.ts` — canonical spatial definitions.
- `scripts/build-interior.cjs` — generates visible floor shells.
- `scripts/stair-socket.cjs` — stair-socket support tooling.
- `components/interior/interior-floor-basement.tsx`
- `components/interior/interior-floor-ground.tsx`
- `components/interior/interior-floor-second.tsx`
- `components/interior/interior-floor-attic.tsx`
- `public/models/interior-*.glb`
- `components/interior/proxy-furniture.tsx`
- `components/interior/home-office-room.tsx`
- `public/models/home-office-furniture.glb`

### Physics and navigation

- `lib/collision.ts` — movement/collision primitives.
- `lib/colliders.ts` — yard/exterior blockers.
- `lib/interior-colliders.ts` — derived room and stair blockers.
- `lib/player-movement.ts`
- `lib/use-player-vertical.ts`
- `lib/player-store.ts`
- `components/fps-controls.tsx`
- `components/mobile-fps-controls.tsx`
- `components/touch-controls.tsx`

### Interaction and UI

- `lib/use-interaction.ts`
- `components/front-door.tsx`
- `components/interior/exit-door.tsx`
- `components/interior/door-placeholder.tsx`
- `components/main-terminal.tsx`
- `components/home-office-ui.tsx`
- `components/terminal-ui.tsx`
- `components/loading-screen.tsx`
- `components/boot-sequence.tsx`

### Rendering

- `components/scene-effects.tsx`
- `components/sky-dome.tsx`
- Drei `Environment` and `Stars`
- Fixed pooled point lights plus one reconfigured directional key light in
  `app/house/page.tsx`.

## Runtime asset policy

- Raw source and editable 3D files do not belong in `public/`.
- Working portfolio assets are kept under `portfolio-assets/` and ignored
  until reviewed.
- Establish a dedicated ignored Blender working directory before creating new
  source files.
- Optimized, browser-ready assets belong in `public/models/` only after
  verification.
- Add new runtime files beside old ones using versioned names.
- Switch code references only after isolated and in-context testing.
- Record source and export details in an asset manifest.

## Validation layers

Every 3D change should pass all applicable layers:

1. Blender scene inspection and clean export.
2. Static GLB inspection and measurements.
3. Isolated web viewer comparison.
4. Production `/house` integration.
5. Entry/exit and interaction checks.
6. Walk every floor and stair.
7. Desktop keyboard/mouse controls.
8. Mobile touch controls.
9. Frame-time, draw-call, texture-memory, and loading checks.
10. TypeScript and production build.
11. Gate and portfolio route smoke tests.

## Ownership boundary for the next task

The new Astra task owns investigation and, after explicit approval, versioned 3D
asset work. It does not own the approved gate, regular portfolio design, project
content production, or broad site redesign.
