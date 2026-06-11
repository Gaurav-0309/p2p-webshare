/**
 * Home.jsx — Landing page
 * Users drop a file here to create a room and get a shareable link.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Shield, Zap, Globe } from 'lucide-react'
import DropZone from '../components/DropZone'
import JoinRoomModal from '../components/JoinRoomModal'
import { useRoom } from '../hooks/useRoom'
import useTransferStore from '../store/transferStore'
import { getSocket } from '../hooks/useSocket'

const FEATURES = [
  { icon: Zap, label: 'Zero latency', desc: 'Direct browser-to-browser. No upload wait.' },
  { icon: Shield, label: 'Zero knowledge', desc: 'Your files never touch our servers.' },
  { icon: Globe, label: 'Zero install', desc: 'Works in any modern browser, instantly.' },
]

export default function Home() {
  const navigate = useNavigate()
  const { file, reset } = useTransferStore()
  const socket = getSocket()
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)

  // Reset state when landing on home
  useEffect(() => {
    reset()
  }, [reset])

  // Connect socket on mount
  useEffect(() => {
    if (!socket.connected) socket.connect()
  }, [socket])

  const handleCreateRoom = () => {
    if (!file) return
    socket.emit('create-room', (response) => {
      if (response.error) {
        console.error('Failed to create room:', response.error)
        return
      }
      const { roomId } = response
      useTransferStore.getState().setRoom(roomId, 'sender')
      navigate(`/room/${roomId}`)
    })
  }

  const handleJoinRoom = (roomId) => {
    setIsJoinModalOpen(false)
    navigate(`/room/${roomId}`)
  }

  return (
    <div className="min-h-screen grid-bg relative overflow-hidden">
      {/* Radial glow in the background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/[0.03] blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-sm flex items-center justify-center">
              <span className="font-display font-black text-void text-sm">P2</span>
            </div>
            <span className="font-display font-semibold text-white tracking-wide">P2P WebShare</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="tag">WebRTC</span>
            <span className="tag">E2E</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Title section */}
        <div className="pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 border border-accent/20 bg-accent/5 rounded-sm px-4 py-1.5 mb-8">
            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            <span className="font-mono text-xs text-accent uppercase tracking-widest">No servers. No storage. No limits.</span>
          </div>

          <h1 className="font-display font-extrabold text-5xl md:text-7xl text-white leading-[1.05] mb-6 animate-fade-in-up">
            Share files{' '}
            <span className="text-accent accent-glow-text">directly</span>
            <br />
            browser to browser.
          </h1>

          <p className="font-body text-muted text-lg md:text-xl max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-100" style={{ opacity: 0 }}>
            Drop a file. Share the link. The recipient downloads directly from your browser
            — the server never sees a byte of your data.
          </p>
        </div>

        {/* Main card */}
        <div className="max-w-xl mx-auto">
          <div className="glass rounded-sm border border-border p-8 space-y-6 animate-fade-in-up delay-200" style={{ opacity: 0 }}>
            <div>
              <h2 className="font-display font-bold text-white text-xl mb-1">Send a file</h2>
              <p className="text-muted text-sm font-body">Drop your file below to create a private transfer room.</p>
            </div>

            <DropZone />

            <button
              onClick={handleCreateRoom}
              disabled={!file}
              className={`
                w-full flex items-center justify-center gap-3 py-4 rounded-sm font-display font-semibold
                text-sm uppercase tracking-widest transition-all duration-200
                ${file
                  ? 'bg-accent text-void hover:bg-accent-dim active:scale-[0.98] accent-glow'
                  : 'bg-ghost text-muted cursor-not-allowed'
                }
              `}
            >
              <span>Create Transfer Room</span>
              <ArrowRight size={16} />
            </button>

            <p className="text-center text-xs font-mono text-ghost">
              Or{' '}
              <button
                className="text-muted hover:text-accent transition-colors underline underline-offset-2"
                onClick={() => setIsJoinModalOpen(true)}
              >
                join a room with an ID
              </button>
            </p>
          </div>
        </div>

        {/* Feature pills */}
        <div className="mt-20 mb-16 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up delay-400" style={{ opacity: 0 }}>
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="glass rounded-sm border border-border p-5 hover:border-accent/30 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-accent/10 border border-accent/20 rounded-sm flex items-center justify-center">
                  <Icon size={16} className="text-accent" />
                </div>
                <span className="font-display font-semibold text-white text-sm">{label}</span>
              </div>
              <p className="text-muted text-xs font-body leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Join Room Modal */}
      <JoinRoomModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoin={handleJoinRoom}
      />

      {/* Footer */}
      <footer className="relative z-10 border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-mono text-xs text-ghost">P2P WebShare — Built with WebRTC</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            <span className="font-mono text-xs text-muted">End-to-end encrypted</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
