"use client"

interface ActionButtonProps {
  label: string
  position: "top" | "right" | "bottom" | "left"
  onPress: () => void
}

export function ActionButton({ label, position, onPress }: ActionButtonProps) {
  const positionClasses = {
    top: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
    right: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
    bottom: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
    left: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
  }

  return (
    <button
      onTouchStart={(e) => {
        e.preventDefault()
        onPress()
      }}
      className={`absolute ${positionClasses[position]} w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm border-2 border-white shadow-lg flex items-center justify-center text-gray-800 font-bold text-sm active:bg-white/60 active:scale-95 transition-all`}
    >
      {label}
    </button>
  )
}
