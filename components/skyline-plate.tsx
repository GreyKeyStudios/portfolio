"use client"

import { useTexture } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import * as THREE from "three"
import { useEffect, useMemo } from "react"

/**
 * The distant skyline, as a single image plate rather than procedural boxes.
 *
 * Replaces the hand-built Minneapolis silhouette in mpls-skyline.tsx. That was
 * ~30 box meshes standing 65 units out purely to be a backdrop — real geometry
 * paying real cost for something the player can never approach.
 *
 * The source art is cropped above its own road (which would otherwise float in
 * mid-air over the yard) and alpha-ramped across its upper 42%, so the plate's
 * painted sky dissolves into the live <Sky> shader instead of cutting a hard
 * rectangle across it.
 *
 * Sized so the tallest tower lands near the old skyline's 21-unit peak — the
 * yard was composed against that height and it still reads correctly.
 */

const TEX = "/textures/skyline.png"

/**
 * The texture is now a RENDER of our own city model rather than a stock photo
 * (scripts/render-skyline-plate.py, then scripts/pack-skyline-render.py). It
 * arrives on transparent film cropped tight to the silhouette, so there is no
 * painted sky to blend away and no alpha ramp to maintain.
 *
 * Its aspect ratio is read off the loaded texture instead of hard-coded,
 * because the crop depends on the city's own silhouette and changes whenever
 * the art is re-rendered. A hard-coded constant here would go stale silently
 * and stretch the skyline — the same shape of bug as the alpha ramp that spent
 * months doing nothing.
 */

/**
 * Distance and size are chosen together, against one target: the towers should
 * subtend about 10 degrees from the street. That is what a downtown a few miles
 * off actually looks like — present on the horizon, not looming.
 *
 * An earlier pass had this at -55 x 46, which put a wall of skyscrapers 25
 * units from the spawn point. That was chasing horizontal coverage: the plate
 * had to fill a 108-degree FOV, and since width is locked to height by the
 * canvas aspect, "wide enough" kept dragging it closer and taller until the
 * city read as the end of the street.
 *
 * Coverage stopped mattering once the sky dome was painted from the same navy
 * as the art (see components/sky-dome.tsx). Seeing past the ends of the city
 * now shows open sky, which is what the ends of a real skyline look like —
 * so the plate is free to sit where it belongs.
 *
 * Geometry, for anyone re-tuning: the texture is cropped to the silhouette, so
 * the plate's top edge IS the tallest tower and its bottom edge is the city's
 * base. BASE_Y sinks that base just under the ground plane so the plate never
 * shows a cut-off edge floating above the horizon.
 *
 * From the spawn at z = -30 the towers therefore subtend
 * atan((20 - 2 - 1.7) / 90) = 10.3 degrees, and the city spans about 44 of
 * horizontal arc — near identical to what the old photo plate actually
 * covered, since most of that canvas was transparent padding.
 */
/**
 * HEIGHT is the plate's world height, and the texture is now cropped tight to
 * the city, so all of it is buildings — earlier versions spent most of this on
 * transparent padding, which is why the same number used to read much smaller.
 *
 * 20 was technically correct (towers at ~10 degrees, right for a downtown a few
 * miles out) and far too small to read: the city spanned ~280px of a 628px
 * view, each building was ~15px wide, and the detail went sub-pixel. Being
 * right about the angle is worth nothing if the detail cannot survive it. At 38
 * the city covers most of the view down the street and the architecture reads.
 */
const HEIGHT = 38
const DEPTH = -120
// Sunk far enough that the city's base is below the yard's ground line rather
// than hanging above it. The gap measured about 5 degrees from the street,
// which at 92 units out is ~8 world units.
const BASE_Y = -13

export function SkylinePlate() {
  const map = useTexture(TEX)
  const maxAnisotropy = useThree((s) => s.gl.capabilities.getMaxAnisotropy())

  // Derived, not declared — see the note above.
  const width = useMemo(() => {
    const img = map.image as { width?: number; height?: number } | undefined
    const aspect = img?.width && img?.height ? img.width / img.height : 3.64
    return HEIGHT * aspect
  }, [map])

  useEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace
    // Single plate, never tiled — clamping avoids a seam of the opposite edge
    // bleeding in at the extremes under anisotropic filtering.
    map.wrapS = THREE.ClampToEdgeWrapping
    map.wrapT = THREE.ClampToEdgeWrapping
    // Max the GPU offers, not a guess. This texture is minified hard — ~1800px
    // of skyline across ~300px of screen — and anisotropy is what stops that
    // becoming speckle.
    map.anisotropy = maxAnisotropy
    map.needsUpdate = true
  }, [map])

  return (
    <mesh position={[0, HEIGHT / 2 + BASE_Y, DEPTH]} renderOrder={-1}>
      <planeGeometry args={[width, HEIGHT]} />
      <meshBasicMaterial
        map={map}
        transparent
        // Unlit on purpose: it is a painted backdrop and must not pick up the
        // yard's moon or point lights, which would tint it and break the
        // illusion of distance.
        toneMapped={false}
        // No depth write — the ground plane in front still occludes it
        // correctly, but it never carves a hole in anything drawn after it.
        depthWrite={false}
        /**
         * Unfogged, and this is not cosmetic. meshBasicMaterial takes scene fog
         * by default, and the fog ends at 90 units — so at any distance that
         * reads as "far away" the plate was being replaced almost entirely by
         * flat fog colour. That is the real reason it kept having to be dragged
         * closer to stay visible.
         *
         * A painted backdrop should not be fogged in any case: the art already
         * has its own atmospheric perspective baked in, and it stands in for
         * infinity, where fog has nothing left to do.
         */
        fog={false}
        side={THREE.FrontSide}
      />
    </mesh>
  )
}

useTexture.preload(TEX)
