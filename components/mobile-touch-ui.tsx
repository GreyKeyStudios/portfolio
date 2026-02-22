"use client"

export function MobileTouchUI() {
  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {/* Touch hint areas */}
      <div className="absolute left-0 top-0 w-1/2 h-full flex items-end justify-start p-8">
        <div className="text-white/60 text-sm">Touch to move</div>
      </div>
      <div className="absolute right-0 top-0 w-1/2 h-full flex items-end justify-end p-8">
        <div className="text-white/60 text-sm">Touch to look</div>
      </div>
    </div>
  )
}
