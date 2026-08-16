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

// Source is 1672 x 784 after cropping.
const ASPECT = 1672 / 784
const HEIGHT = 40
const WIDTH = HEIGHT * ASPECT

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
    <mesh position={[0, HEIGHT / 2 - 3, -72]} renderOrder={-1}>
      <planeGeometry args={[WIDTH, HEIGHT]} />
      <meshBasicMaterial
        map={map}
        transparent
        // Unlit on purpose: it is a painted backdrop and must not pick up the
        // yard's moon or point lights, which would tint it and break the
        // illusion of distance.
        toneMapped={false}
        // No depth write — the fog and the ground plane in front still occlude
        // it correctly, but it never carves a hole in anything drawn after it.
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  )
}

useTexture.preload(TEX)
