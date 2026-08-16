"use client"

import { useTexture } from "@react-three/drei"
import * as THREE from "three"
import { useEffect } from "react"

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

// Canvas is 4096 x 784; the skyline itself occupies the middle ~41% and the
// rest is transparent, feathered extension. HEIGHT is the height of the whole
// canvas, of which the buildings are the lower ~58% — the top 42% is the alpha
// ramp that dissolves the painted sky into the sky dome.
const ASPECT = 4096 / 784

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
 * Geometry, for anyone re-tuning: buildings top out at 0.58 * HEIGHT - 3 in
 * world Y, and the eye is at 1.7, so from the spawn at z = -30 the towers
 * subtend atan((0.58 * 36 - 4.7) / 90) = 10.0 degrees, and the plate spans
 * about 92 degrees of horizontal arc.
 */
const HEIGHT = 36
const WIDTH = HEIGHT * ASPECT
const DEPTH = -120

export function SkylinePlate() {
  const map = useTexture(TEX)

  useEffect(() => {
    map.colorSpace = THREE.SRGBColorSpace
    // Single plate, never tiled — clamping avoids a seam of the opposite edge
    // bleeding in at the extremes under anisotropic filtering.
    map.wrapS = THREE.ClampToEdgeWrapping
    map.wrapT = THREE.ClampToEdgeWrapping
    map.anisotropy = 4
    map.needsUpdate = true
  }, [map])

  return (
    <mesh position={[0, HEIGHT / 2 - 3, DEPTH]} renderOrder={-1}>
      <planeGeometry args={[WIDTH, HEIGHT]} />
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
