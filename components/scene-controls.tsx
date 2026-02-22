"use client"

import { useControls } from "leva"

export function useSceneControls() {
  const porchLight = useControls("Porch Light", {
    x: { value: 1.25, min: -10, max: 10, step: 0.25 },
    z: { value: -2.7, min: -10, max: 5, step: 0.25 },
  })

  const walkwayGap = useControls("Fence: Walkway Gap", {
    center: { value: 3.5, min: -12, max: 12, step: 0.25 },
    half: { value: 1.75, min: 0.5, max: 6, step: 0.25 },
  })

  return { porchLight, walkwayGap }
}
