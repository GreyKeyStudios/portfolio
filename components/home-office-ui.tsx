"use client"

import { useEffect, useState } from 'react'
import { usePlayerStore } from '@/lib/player-store'
import { HOME_OFFICE_PROJECTS, type Project } from '@/lib/projects-data'

const STATUS_COLOR: Record<Project['status'], string> = {
  live: '#00ff88',
  'in-progress': '#f6c97a',
  concept: '#86a4f6',
}

export function HomeOfficeUI() {
  const { homeOfficeOpen, closeHomeOffice } = usePlayerStore()
  const [selected, setSelected] = useState<Project | null>(null)

  useEffect(() => {
    if (homeOfficeOpen) setSelected(HOME_OFFICE_PROJECTS[0] ?? null)
  }, [homeOfficeOpen])

  useEffect(() => {
    if (!homeOfficeOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeHomeOffice()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [homeOfficeOpen, closeHomeOffice])

  if (!homeOfficeOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex font-mono text-sm"
      style={{ background: 'rgba(4, 8, 16, 0.97)', color: '#becdf6' }}
    >
      {/* Close hint */}
      <button
        onClick={closeHomeOffice}
        className="fixed top-3 right-4 z-30 text-xs opacity-40 hover:opacity-80 transition-opacity"
        style={{ color: '#becdf6' }}
      >
        [Esc] close
      </button>

      {/* Project list */}
      <div className="w-72 flex-shrink-0 overflow-y-auto border-r px-4 py-6" style={{ borderColor: '#becdf622' }}>
        <div className="text-xs opacity-50 mb-4 tracking-wide">PROJECTS</div>
        {HOME_OFFICE_PROJECTS.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className="block w-full text-left px-3 py-2 rounded mb-1 transition-colors"
            style={{
              background: selected?.id === p.id ? '#becdf615' : 'transparent',
              border: `1px solid ${selected?.id === p.id ? '#becdf644' : 'transparent'}`,
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: STATUS_COLOR[p.status] }}
              />
              <span>{p.name}</span>
            </div>
            <div className="text-xs opacity-50 pl-3.5">{p.category}</div>
          </button>
        ))}
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto px-10 py-10">
        {selected && (
          <>
            <div className="text-xs opacity-50 mb-2 tracking-wide">{selected.category.toUpperCase()}</div>
            <h2 className="text-2xl font-bold mb-3">{selected.name}</h2>
            <div className="flex items-center gap-2 mb-6 text-xs">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: STATUS_COLOR[selected.status] }}
              />
              <span style={{ color: STATUS_COLOR[selected.status] }}>{selected.status}</span>
            </div>
            <p className="opacity-80 leading-relaxed mb-6 max-w-xl">{selected.description}</p>
            {selected.tech.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selected.tech.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-1 rounded"
                    style={{ background: '#becdf615', border: '1px solid #becdf633' }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              {selected.url && (
                <a
                  href={selected.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs px-4 py-2 rounded"
                  style={{ background: '#00ff8822', border: '1px solid #00ff88', color: '#00ff88' }}
                >
                  Visit →
                </a>
              )}
              {selected.github && (
                <a
                  href={selected.github}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs px-4 py-2 rounded"
                  style={{ background: '#ffffff11', border: '1px solid #ffffff33', color: '#becdf6' }}
                >
                  GitHub
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
