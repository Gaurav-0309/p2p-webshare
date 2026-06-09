import { useState } from 'react'
import { Terminal, ChevronDown, ChevronUp } from 'lucide-react'
import useTransferStore from '../store/transferStore'

export default function DebugPanel({ peerConnection }) {
  const [open, setOpen] = useState(false)
  const { role, roomId, connectionStatus, peerConnected, transferStatus, progress, speed } = useTransferStore()

  if (import.meta.env.PROD) return null

  const pc = peerConnection?.current
  const rows = [
    ['Role', role ?? '—'],
    ['Room', roomId ?? '—'],
    ['Connection', connectionStatus],
    ['Peer Connected', String(peerConnected)],
    ['Transfer', transferStatus],
    ['Progress', `${Math.round(progress * 100)}%`],
    ['Speed', speed > 0 ? `${(speed / 1024 / 1024).toFixed(2)} MB/s` : '—'],
    ['ICE State', pc?.iceConnectionState ?? '—'],
    ['ICE Gathering', pc?.iceGatheringState ?? '—'],
    ['Signaling', pc?.signalingState ?? '—'],
  ]

  const color = (v) => {
    if (['connected', 'complete', 'true'].includes(v)) return 'text-accent'
    if (['failed', 'closed', 'false'].includes(v)) return 'text-red-400'
    if (['connecting', 'checking', 'gathering'].includes(v)) return 'text-yellow-400'
    return 'text-muted'
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono text-xs">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-panel border border-border rounded-sm px-3 py-2 text-muted hover:text-white hover:border-accent/40 transition-all">
        <Terminal size={12} />
        <span className="uppercase tracking-widest">Debug</span>
        {open ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
      </button>
      {open && (
        <div className="mt-1 bg-panel border border-border rounded-sm p-4 w-64 space-y-1.5 shadow-xl animate-fade-in">
          <p className="text-ghost uppercase tracking-widest text-[10px] mb-3 border-b border-border pb-2">WebRTC Debug</p>
          {rows.map(([label, val]) => (
            <div key={label} className="flex justify-between gap-4">
              <span className="text-ghost">{label}</span>
              <span className={color(val)}>{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}