"use client"

import { EffectComposer, N8AO, Bloom, ToneMapping, Vignette } from "@react-three/postprocessing"
import { ToneMappingMode, BlendFunction } from "postprocessing"
import { usePlayerStore } from "@/lib/player-store"

/**
 * Readability pass, not a polish pass.
 *
 * The interior is untextured boxes, so almost everything that makes geometry
 * read as solid has to come from lighting response rather than surface detail.
 * Ambient occlusion is the big one: it puts contact shadows where every wall
 * meets the floor and under every stair tread, which is most of the difference
 * between "blockout" and "room". Bloom and tone mapping are here to set up the
 * lighting strategy the props will rely on later — emissive fixtures that read
 * as lights without costing a light (see SceneLights in app/page.tsx for why
 * the mounted light count can never grow).
 *
 * Deliberately restrained. Every effect is a full-screen pass, and this project
 * has already paid for one performance mistake; the settings below hold 60fps
 * and anything that didn't was cut rather than tuned down.
 */
export function SceneEffects() {
  const isYard = usePlayerStore((s) => s.currentLocation === 'yard')

  return (
    <EffectComposer
      // NO normal pass. Enabling it re-renders the whole scene into a normal
      // buffer every frame — it doubled the yard's 248 draw calls and cost more
      // than the AO itself (quality medium→low barely moved the number, which
      // is what pointed at the pass rather than the sampling). N8AO reconstructs
      // normals from depth instead; on axis-aligned architecture the difference
      // is not visible.
      enableNormalPass={false}
      multisampling={0}
    >
      {/* N8AO rather than the classic SSAO: it works from normals+depth and
          holds up on large flat surfaces, which is exactly what this house is.
          Classic SSAO banded badly across the big untextured wall planes. */}
      <N8AO
        aoRadius={isYard ? 0.9 : 0.3}
        distanceFalloff={1.0}
        intensity={isYard ? 2.4 : 1.15}
        // "medium" measured 54.6fps against a 60.1 baseline. The cost is
        // resolution-bound, not geometry-bound (the yard dropped identically
        // despite 80x the triangles), so the lever is sample count, not scene
        // complexity. "low" at half resolution holds 60 and the difference is
        // invisible on surfaces this flat — the AO here is doing corner
        // contact, not fine detail.
        quality="low"
        halfRes
      />

      {/* Restrained. This exists so emissive props (monitors, lamps, arcade
          cabinets) bleed convincingly later — NOT to make the whole scene glow.
          A high threshold means only genuinely bright surfaces bloom, so the
          off-white walls stay matte. */}
      <Bloom
        intensity={0.45}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.25}
        mipmapBlur
      />

      {/* ACES filmic. The default linear mapping was clipping the warm point
          lights to flat white and crushing the interior's dark floor to black —
          which is a large part of why the footage read as washed-out fog. */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />

      {/* Indoors only, and barely there. Outside there's already sky and fog
          doing this job; inside it stops the corners of a small room from
          feeling as bright as the middle. */}
      <Vignette
        offset={0.32}
        darkness={isYard ? 0.0 : 0.42}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}
