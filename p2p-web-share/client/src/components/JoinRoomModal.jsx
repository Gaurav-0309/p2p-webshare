import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

export default function JoinRoomModal({ isOpen, onClose, onJoin }) {
  const [roomId, setRoomId] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setRoomId('')
    }
  }, [isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (roomId.trim()) {
      onJoin(roomId.trim())
      setRoomId('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass rounded-sm border border-accent/30 p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-white text-xl">Join Room</h2>
            <button
              onClick={onClose}
              className="text-muted hover:text-accent transition-colors p-1"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="roomId" className="block text-sm font-body text-muted mb-2">
                Enter Room ID
              </label>
              <input
                ref={inputRef}
                id="roomId"
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., abc123xyz"
                className="w-full px-4 py-3 bg-void border border-border rounded-sm text-white placeholder-ghost focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors duration-200 font-body"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-ghost border border-border text-muted rounded-sm font-display font-semibold text-sm uppercase tracking-widest hover:border-accent/30 hover:text-accent transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!roomId.trim()}
                className={`
                  flex-1 px-4 py-2.5 rounded-sm font-display font-semibold text-sm uppercase tracking-widest transition-all duration-200
                  ${roomId.trim()
                    ? 'bg-accent text-void hover:bg-accent-dim active:scale-[0.98] accent-glow'
                    : 'bg-ghost text-muted cursor-not-allowed'
                  }
                `}
              >
                Join
              </button>
            </div>
          </form>

          {/* Helper text */}
          <p className="text-xs text-ghost font-mono mt-4 text-center">
            Press <span className="text-accent">Esc</span> to cancel
          </p>
        </div>
      </div>
    </div>
  )
}
