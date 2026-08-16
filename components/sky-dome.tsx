"use client"

import { useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

/**
 * The night sky, as a hand-painted gradient rather than an atmospheric model.
 *
 * Replaces drei's <Sky>, which runs the Preetham scattering model. That model
 * is physically derived and produces a bright dusk gradient — pale blue high
 * up, warm tan near the horizon. It looked nothing like the skyline plate
 * standing in front of it, so the plate read as a distinct dark rectangle
 * pasted onto a bright sky. No amount of resizing the plate could fix that;
 * the problem was never its size, it was that the two skies were different
 * colours.
 *
 * The stops below are sampled from the skyline art itself (see
 * scripts/build-skyline-plate.py, which prints them on every build) and land on
 * the brand navy in the middle of the ramp. That is not a coincidence worth
 * hiding: the logo's cube is #1a2952 and the art's sky is #152a53, near enough
 * to identical that the same palette serves the mark and the horizon.
 *
 * Cheaper than <Sky> too — one gradient, no scattering integral.
 */

/**
 * Gradient stops, low to high, keyed on the view direction's Y component
 * (0 at the horizon, 1 straight up).
 *
 * SKY_HORIZON matches the plate's opaque sky band, so where the plate's alpha
 * ramp hands over to the live sky there is no step in colour. SKY_MID is the
 * brand navy. SKY_ZENITH is near the brand black, which keeps the Stars
 * readable overhead — against the old dusk sky most of them were invisible.
 */
const STOPS: [number, string][] = [
  // Horizon. A shade above the plate's band so there is a faint city glow
  // sitting under the skyline rather than a flat wall of one colour.
  [0.0, "#4b5c84"],
  // Matches the plate's sky where its alpha ramp finishes and the art goes
  // fully opaque — measured at #42557f by scripts/build-skyline-plate.py. This
  // is the stop that has to be right; it is where the two skies meet.
  [0.17, "#42557f"],
  [0.45, "#1a2952"],
  [1.0, "#05070f"],
]

const VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * The dither is not optional decoration. A smooth gradient across this much
 * screen area lands within one 8-bit step over long stretches, which shows up
 * as very visible horizontal banding — worse on phone panels than on a
 * monitor. A sub-LSB hash offset breaks the bands into noise the eye reads as
 * a clean ramp.
 */
// Built from STOPS rather than written out, so the thresholds cannot drift away
// from the colours they belong to when the ramp gets retuned.
const FRAG = /* glsl */ `
  varying vec3 vDir;
  ${STOPS.map((_, i) => `uniform vec3 c${i};`).join("\n  ")}

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    float t = clamp(vDir.y, 0.0, 1.0);
    vec3 col = c0;
    ${STOPS.slice(1)
      .map(
        ([pos], i) =>
          `col = mix(col, c${i + 1}, smoothstep(${STOPS[i][0].toFixed(3)}, ${pos.toFixed(3)}, t));`
      )
      .join("\n    ")}
    col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(col, 1.0);
  }
`

export function SkyDome() {
  const ref = useRef<THREE.Mesh>(null)
  const { camera } = useThree()

  const uniforms = useMemo(
    () =>
      Object.fromEntries(
        // Linearised here because the material is toneMapped={false} and the
        // renderer converts back to sRGB on output — so the hex above is what
        // actually lands on screen, and can be compared against the art.
        STOPS.map(([, hex], i) => [
          `c${i}`,
          { value: new THREE.Color(hex).convertSRGBToLinear() },
        ])
      ),
    []
  )

  // Follows the camera so the gradient never shifts underfoot as you cross the
  // yard. Position only — no rotation — so the horizon stays level.
  useFrame(() => {
    if (ref.current) ref.current.position.copy(camera.position)
  })

  return (
    <mesh ref={ref} renderOrder={-2} frustumCulled={false}>
      {/* Radius sits inside the 2000 default far-clip with room to spare. Low
          segment count is deliberate: the gradient is evaluated per-fragment,
          so the sphere is only ever a shell to hang it on. */}
      <sphereGeometry args={[900, 32, 16]} />
      <shaderMaterial
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        side={THREE.BackSide}
        // Never occludes anything and never receives fog — it IS the distance.
        depthWrite={false}
        fog={false}
        toneMapped={false}
      />
    </mesh>
  )
}
