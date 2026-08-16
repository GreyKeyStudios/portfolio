"use client"

import { useState, useEffect } from "react"
import { Html } from "@react-three/drei"

export function AboutTerminal({ position }: { position: [number, number, number] }) {
  const [terminalText, setTerminalText] = useState("")
  const [showCursor, setShowCursor] = useState(true)
  const [isActive, setIsActive] = useState(false)

  const fullText = `
$ whoami
stack_house_dev

$ cat about.txt
Creative Developer & Digital Architect
Building experiences that blur the line between
code and creativity...

$ ls -la skills/
drwxr-xr-x  frontend/     [React, Next.js, Three.js]
drwxr-xr-x  backend/      [Node.js, Python, APIs]  
drwxr-xr-x  creative/     [Music, Games, Recipes]
drwxr-xr-x  ai/           [Prompt Engineering, ML]

$ echo "Welcome to The Stack House"
Welcome to The Stack House
Where every room tells a story...

$ _`

  useEffect(() => {
    if (!isActive) return

    let i = 0
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setTerminalText(fullText.slice(0, i + 1))
        i++
      } else {
        clearInterval(timer)
      }
    }, 50)

    return () => clearInterval(timer)
  }, [isActive])

  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 500)

    return () => clearInterval(cursorTimer)
  }, [])

  return (
    <group position={position}>
      {/* Terminal Screen */}
      <mesh onClick={() => setIsActive(true)}>
        <boxGeometry args={[2, 1.5, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Terminal Base */}
      <mesh position={[0, -0.9, 0.1]}>
        <boxGeometry args={[2.2, 0.3, 0.8]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      {/* Screen Content */}
      <Html position={[0, 0, 0.06]} center>
        <div
          className="w-96 h-72 bg-black text-green-400 font-mono text-xs p-4 overflow-hidden cursor-pointer border-2 border-gray-600 rounded"
          onClick={() => setIsActive(true)}
        >
          {!isActive ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-green-500 mb-2">█ STACK_TERMINAL v2.1 █</div>
                <div className="text-gray-500">Click to boot...</div>
                <div className="animate-pulse mt-2">▓</div>
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">
              {terminalText}
              {showCursor && <span className="bg-green-400 text-black">█</span>}
            </div>
          )}
        </div>
      </Html>

      {/* Terminal Label */}
      <Html position={[0, -1.3, 0]} center>
        <div className="text-white text-sm font-bold bg-black bg-opacity-50 px-2 py-1 rounded">ABOUT.EXE</div>
      </Html>
    </group>
  )
}
