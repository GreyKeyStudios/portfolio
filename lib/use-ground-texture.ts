"use client"

import { useTexture } from "@react-three/drei"
import { useMemo } from "react"
import { RepeatWrapping, SRGBColorSpace, type Texture } from "three"

export type GroundMaterial = "concrete" | "asphalt" | "grass"

/**
 * Loads a baked tiling PBR pair (base color + normal) from /public/textures and
 * configures repeat so one texel density is shared across every ground surface.
 *
 * `tilesPerUnit` is in tiles per world unit, so a 40×2.5 sidewalk and a 6×14
 * walkway end up with matching paving scale without hand-tuning each one.
 *
 * The textures are cloned per call: drei's useTexture caches by URL, so every
 * concrete surface would otherwise share one Texture and stomp each other's
 * repeat values. Clones share the underlying image source, so this costs
 * bookkeeping rather than another decode/upload.
 */
export function useGroundTexture(
  name: GroundMaterial,
  tilesPerUnit: number,
  width: number,
  depth: number,
) {
  const [baseMap, baseNormal] = useTexture([
    `/textures/${name}_basecolor.jpg`,
    `/textures/${name}_normal.jpg`,
  ])

  return useMemo(() => {
    const configure = (source: Texture, srgb: boolean) => {
      const t = source.clone()
      t.wrapS = RepeatWrapping
      t.wrapT = RepeatWrapping
      t.repeat.set(width * tilesPerUnit, depth * tilesPerUnit)
      if (srgb) t.colorSpace = SRGBColorSpace
      t.needsUpdate = true
      return t
    }
    return {
      map: configure(baseMap, true),
      normalMap: configure(baseNormal, false),
    }
  }, [baseMap, baseNormal, tilesPerUnit, width, depth])
}
