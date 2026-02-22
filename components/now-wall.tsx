"use client"

import { useState } from "react"
import { Html } from "@react-three/drei"

export function NowWall({ position }: { position: [number, number, number] }) {
  const [selectedNote, setSelectedNote] = useState<string | null>(null)

  const stickyNotes = [
    {
      id: "1",
      color: "#FFE066",
      text: "Building The Stack House 🏠",
      detail: "Creating this immersive portfolio experience with Three.js and React",
      rotation: -5,
      position: [-0.3, 0.2, 0.01],
    },
    {
      id: "2",
      color: "#FF6B6B",
      text: "EchoMuse v2.0 🎵",
      detail: "AI-powered music mood sync app - currently in beta testing",
      rotation: 8,
      position: [0.4, 0.1, 0.01],
    },
    {
      id: "3",
      color: "#4ECDC4",
      text: "Soul In a Pot 🍲",
      detail: "Recipe blog for OMAD and air fryer creations - launching soon!",
      rotation: -3,
      position: [-0.1, -0.2, 0.01],
    },
    {
      id: "4",
      color: "#95E1D3",
      text: "Secret Project 🤫",
      detail: "Something big is brewing... can't say more yet 👀",
      rotation: 12,
      position: [0.2, 0.3, 0.01],
    },
    {
      id: "5",
      color: "#F38BA8",
      text: "Learning Rust 🦀",
      detail: "Diving deep into systems programming - it's harder than I thought!",
      rotation: -8,
      position: [-0.4, -0.1, 0.01],
    },
  ]

  return (
    <group position={position}>
      {/* Whiteboard/Cork Board */}
      <mesh>
        <boxGeometry args={[3, 2, 0.05]} />
        <meshStandardMaterial color="#F5F5DC" />
      </mesh>

      {/* Frame */}
      <mesh>
        <boxGeometry args={[3.2, 2.2, 0.03]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Sticky Notes */}
      {stickyNotes.map((note) => (
        <group key={note.id}>
          <Html position={note.position as [number, number, number]} center transform>
            <div
              className="w-24 h-24 p-2 text-xs font-handwriting cursor-pointer transform transition-transform hover:scale-110 hover:z-10 shadow-md"
              style={{
                backgroundColor: note.color,
                transform: `rotate(${note.rotation}deg)`,
              }}
              onClick={() => setSelectedNote(selectedNote === note.id ? null : note.id)}
            >
              <div className="text-gray-800 font-medium leading-tight">{note.text}</div>
              {selectedNote === note.id && (
                <div className="absolute top-full left-0 mt-2 w-48 p-3 bg-white border-2 border-gray-300 rounded shadow-lg z-50 text-gray-700">
                  {note.detail}
                </div>
              )}
            </div>
          </Html>
        </group>
      ))}

      {/* Wall Label */}
      <Html position={[0, -1.3, 0]} center>
        <div className="text-white text-sm font-bold bg-black bg-opacity-50 px-2 py-1 rounded">
          NOW WALL - What I'm Building
        </div>
      </Html>
    </group>
  )
}
