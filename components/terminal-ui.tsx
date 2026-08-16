"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePlayerStore } from '@/lib/player-store'

// ─── Types ────────────────────────────────────────────────────────────────────

type LineType = 'output' | 'input' | 'error' | 'success' | 'system'

interface Line {
  text: string
  type: LineType
}

// ─── Boot message ─────────────────────────────────────────────────────────────

const BOOT_LINES: Line[] = [
  { text: '╔══════════════════════════════════════╗', type: 'system' },
  { text: '║        STACKHOUSE OS  v1.0.0         ║', type: 'system' },
  { text: '╚══════════════════════════════════════╝', type: 'system' },
  { text: 'Connected: visitor@stackhouse', type: 'output' },
  { text: 'Type "help" for available commands.', type: 'output' },
  { text: '', type: 'output' },
]

// ─── Filesystem structure ─────────────────────────────────────────────────────

const FS: Record<string, string[]> = {
  '~': ['about/', 'projects/', 'building/', 'secrets/'],
  '~/building': ['front-door', 'garage [coming soon]'],
  '~/about': ['bio.txt', 'stack.txt', 'contact.txt'],
  '~/projects': ['[loading from cloud...]'],
  '~/secrets': ['you_found_me.txt'],
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TerminalUI() {
  const { terminalOpen, closeTerminal, frontDoorUnlocked, unlockFrontDoor } = usePlayerStore()

  const [lines, setLines] = useState<Line[]>(BOOT_LINES)
  const [input, setInput] = useState('')
  const [cwd, setCwd] = useState('~')
  const [inputHistory, setInputHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // ── Focus input when terminal opens ───────────────────────────────────────
  // fps-controls.tsx calls document.exitPointerLock() the moment terminalOpen
  // flips true, but that's async — the browser fires 'pointerlockchange' once
  // it actually completes. Focusing on a flat setTimeout guessed at that
  // timing and could lose the race under load, leaving the terminal visible
  // but not accepting keyboard input (looks "stuck": paused, no visible error,
  // nothing responds). Focus for real once the lock is confirmed released,
  // with the old delay kept only as a fallback in case it was already unlocked.
  useEffect(() => {
    if (!terminalOpen) return

    if (!document.pointerLockElement) {
      inputRef.current?.focus()
      return
    }

    const onLockChange = () => {
      if (!document.pointerLockElement) {
        inputRef.current?.focus()
        document.removeEventListener('pointerlockchange', onLockChange)
      }
    }
    document.addEventListener('pointerlockchange', onLockChange)
    // Fallback in case pointerlockchange never fires (e.g. lock was never
    // really held) so the terminal doesn't end up permanently unfocused.
    const fallback = setTimeout(() => inputRef.current?.focus(), 300)

    return () => {
      document.removeEventListener('pointerlockchange', onLockChange)
      clearTimeout(fallback)
    }
  }, [terminalOpen])

  // ── Scroll to bottom on new output ────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  // ── Esc to close ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!terminalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTerminal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [terminalOpen, closeTerminal])

  // ── Command processor ─────────────────────────────────────────────────────
  const prompt = `visitor@stackhouse:${cwd}$`

  const addLines = useCallback((...newLines: Line[]) => {
    setLines(prev => [...prev, ...newLines])
  }, [])

  const processCommand = useCallback((raw: string) => {
    const cmd = raw.trim()
    if (!cmd) return

    // Echo the input line
    addLines({ text: `${prompt} ${cmd}`, type: 'input' })

    const parts = cmd.split(/\s+/)
    const verb = parts[0].toLowerCase()
    const arg = parts.slice(1).join(' ')

    switch (verb) {

      case 'help':
        addLines(
          { text: '', type: 'output' },
          { text: 'Commands:', type: 'output' },
          { text: '  help              show this list', type: 'output' },
          { text: '  ls                list directory contents', type: 'output' },
          { text: '  cd <dir>          change directory', type: 'output' },
          { text: '  unlock <item>     unlock something (try: unlock front-door)', type: 'output' },
          { text: '  status            show current game state', type: 'output' },
          { text: '  whoami            who are you, really', type: 'output' },
          { text: '  clear             clear the screen', type: 'output' },
          { text: '  exit              close this terminal', type: 'output' },
          { text: '', type: 'output' },
        )
        break

      case 'ls': {
        const contents = FS[cwd]
        if (!contents) {
          addLines({ text: 'ls: cannot access directory', type: 'error' })
          break
        }
        // For building/, show live lock status
        if (cwd === '~/building') {
          addLines(
            { text: '', type: 'output' },
            { text: `  front-door   [${frontDoorUnlocked ? 'unlocked ✓' : 'locked'}]`, type: frontDoorUnlocked ? 'success' : 'output' },
            { text: '  garage       [coming soon]', type: 'output' },
            { text: '', type: 'output' },
          )
        } else {
          addLines({ text: '', type: 'output' })
          contents.forEach(item => addLines({ text: `  ${item}`, type: 'output' }))
          addLines({ text: '', type: 'output' })
        }
        break
      }

      case 'cd': {
        if (!arg || arg === '~') {
          setCwd('~')
          break
        }
        if (arg === '..') {
          setCwd('~')
          break
        }
        const target = `~/${arg.replace(/^\//, '')}`
        if (FS[target]) {
          setCwd(target)
        } else {
          addLines({ text: `cd: ${arg}: No such directory`, type: 'error' })
        }
        break
      }

      case 'unlock': {
        if (!arg) {
          addLines({ text: 'unlock: specify what to unlock (e.g. unlock front-door)', type: 'error' })
          break
        }
        if (arg === 'front-door' || arg === 'front_door' || arg === 'door') {
          if (cwd !== '~/building') {
            addLines(
              { text: 'Permission denied — you must be in ~/building to unlock doors.', type: 'error' },
              { text: 'Try: cd building', type: 'output' },
            )
            break
          }
          if (frontDoorUnlocked) {
            addLines({ text: 'Front door is already unlocked.', type: 'success' })
            break
          }
          addLines(
            { text: 'Checking permissions...', type: 'output' },
            { text: 'Access granted.', type: 'success' },
            { text: '>> FRONT DOOR UNLOCKED <<', type: 'success' },
            { text: 'Walk to the front door and press E to enter.', type: 'output' },
          )
          unlockFrontDoor()
        } else {
          addLines({ text: `unlock: ${arg}: unknown target`, type: 'error' })
        }
        break
      }

      case 'status':
        addLines(
          { text: '', type: 'output' },
          { text: '── Game State ──────────────────────', type: 'system' },
          { text: `  front-door    ${frontDoorUnlocked ? 'unlocked ✓' : 'locked ✗'}`, type: frontDoorUnlocked ? 'success' : 'output' },
          { text: '  garage        [coming soon]', type: 'output' },
          { text: '', type: 'output' },
        )
        break

      case 'whoami':
        addLines(
          { text: 'visitor — unknown entity.', type: 'output' },
          { text: 'Prove yourself.', type: 'output' },
        )
        break

      case 'clear':
        setLines([])
        break

      case 'exit':
        closeTerminal()
        break

      default:
        addLines({ text: `${verb}: command not found. Type "help" for available commands.`, type: 'error' })
    }
  }, [prompt, cwd, frontDoorUnlocked, unlockFrontDoor, addLines, closeTerminal])

  // ── Key handling ──────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const cmd = input
      setInputHistory(prev => cmd ? [cmd, ...prev] : prev)
      setHistoryIdx(-1)
      setInput('')
      processCommand(cmd)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHistoryIdx(prev => {
        const next = Math.min(prev + 1, inputHistory.length - 1)
        setInput(inputHistory[next] ?? '')
        return next
      })
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHistoryIdx(prev => {
        const next = Math.max(prev - 1, -1)
        setInput(next === -1 ? '' : (inputHistory[next] ?? ''))
        return next
      })
    }
  }

  // ── Don't render when closed ──────────────────────────────────────────────
  if (!terminalOpen) return null

  // ── Line color map ────────────────────────────────────────────────────────
  const lineColor: Record<LineType, string> = {
    output:  '#b8c8a8',
    input:   '#00ff88',
    error:   '#ff6666',
    success: '#00ff88',
    system:  '#5588aa',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col font-mono text-sm"
      style={{ background: 'rgba(4, 8, 16, 0.97)' }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
        }}
      />

      {/* Close hint */}
      <div className="relative z-20 flex justify-end px-4 pt-3 pb-1">
        <button
          onClick={closeTerminal}
          className="text-xs opacity-40 hover:opacity-80 transition-opacity"
          style={{ color: '#b8c8a8' }}
        >
          [Esc] close
        </button>
      </div>

      {/* Output area */}
      <div className="relative z-20 flex-1 overflow-y-auto px-6 py-2" style={{ color: '#b8c8a8' }}>
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              color: lineColor[line.type],
              whiteSpace: 'pre',
              lineHeight: '1.6',
              textShadow: line.type === 'success' || line.type === 'input'
                ? '0 0 8px rgba(0,255,136,0.4)'
                : 'none',
            }}
          >
            {line.text || '\u00A0'}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div
        className="relative z-20 flex items-center gap-2 px-6 py-4 border-t"
        style={{ borderColor: '#00ff8820' }}
      >
        <span style={{ color: '#00ff88', textShadow: '0 0 6px rgba(0,255,136,0.5)', flexShrink: 0 }}>
          {prompt}
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none caret-green-400"
          style={{ color: '#00ff88', textShadow: '0 0 6px rgba(0,255,136,0.4)' }}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  )
}
