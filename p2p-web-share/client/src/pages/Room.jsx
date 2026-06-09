import { useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Download } from 'lucide-react'
import RoomLink from '../components/RoomLink'
import ConnectionStatus from '../components/ConnectionStatus'
import ProgressBar from '../components/ProgressBar'
import FileCard from '../components/FileCard'
import { useWebRTC } from '../hooks/useWebRTC'
import { useFileTransfer } from '../hooks/useFileTransfer'
import { getSocket } from '../hooks/useSocket'
import useTransferStore from '../store/transferStore'

export default function Room() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const socket = getSocket()
  const hasJoinedRef = useRef(false)

  const {
    role, file, fileName, fileSize, fileType,
    peerConnected, transferStatus, errorMessage, setRoom,
  } = useTransferStore()

  const { sendFile, receiveFile } = useFileTransfer()

  const handleDataChannelOpen = useCallback((dc) => {
    const currentRole = useTransferStore.getState().role
    const currentFile = useTransferStore.getState().file
    console.log('[Room] Data channel open, role:', currentRole)
    if (currentRole === 'sender' && currentFile) {
      sendFile(dc, currentFile)
    } else if (currentRole === 'receiver') {
      receiveFile(dc)
    }
  }, [sendFile, receiveFile])

  const { closePeerConnection, peerConnection } = useWebRTC({
    roomId,
    role,
    onDataChannel: handleDataChannelOpen,
  })

  useEffect(() => {
    if (hasJoinedRef.current) return
    hasJoinedRef.current = true
    if (!socket.connected) socket.connect()

    const currentRole = useTransferStore.getState().role
    if (!currentRole) {
      setRoom(roomId, 'receiver')
      socket.emit('join-room', { roomId }, (response) => {
        if (response?.error) console.error('[Room] Join failed:', response.error)
        else console.log('[Room] Joined as receiver ✓')
      })
    } else {
      console.log('[Room] Entered as:', currentRole)
    }
  }, [roomId, socket, setRoom])

  const isSender = role === 'sender'
  const isTransferring = transferStatus === 'transferring'
  const isComplete = transferStatus === 'complete'

  const title = isComplete
    ? isSender ? 'File sent!' : 'Download complete!'
    : isSender
      ? peerConnected ? 'Sending file...' : 'Waiting for recipient...'
      : peerConnected ? 'Receiving file...' : 'Connecting to sender...'

  const subtitle = isComplete
    ? isSender
      ? 'Transfer complete. The server never saw a byte of your file.'
      : 'File verified and saved locally. Direct P2P transfer complete.'
    : isSender
      ? peerConnected
        ? 'Streaming directly to the recipient. No server involved.'
        : 'Share the link below. Transfer starts when they open it.'
      : 'The file will download automatically when the transfer is done.'

  return (
    <div className="min-h-screen grid-bg relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[500px] h-[500px] rounded-full blur-3xl transition-all duration-1000
          ${peerConnected ? 'bg-accent/[0.04] opacity-100' : 'opacity-0'}`}
        />
      </div>

      <header className="relative z-10 border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => { closePeerConnection(); navigate('/') }}
              className="text-muted hover:text-white transition-colors p-1 -ml-1">
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-accent rounded-sm flex items-center justify-center">
                <span className="font-display font-black text-void text-xs">P2</span>
              </div>
              <span className="font-display font-semibold text-white">P2P WebShare</span>
            </div>
          </div>
          <ConnectionStatus />
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-12 space-y-6">
        <div className="space-y-2 animate-fade-in-up">
          <div className="flex items-center gap-2">
            <span className={`tag ${isSender
              ? 'text-accent border-accent/30 bg-accent/5'
              : 'text-blue-400 border-blue-400/30 bg-blue-400/5'}`}>
              {isSender
                ? <><Send size={10} className="inline mr-1" />Sender</>
                : <><Download size={10} className="inline mr-1" />Receiver</>}
            </span>
            <span className="font-mono text-xs text-ghost">room: {roomId}</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-white">{title}</h1>
          <p className="text-muted text-sm font-body leading-relaxed">{subtitle}</p>
        </div>

        {isSender && !peerConnected && !isComplete && (
          <div className="glass border border-border rounded-sm p-6 animate-fade-in-up delay-100">
            <RoomLink roomId={roomId} />
          </div>
        )}

        {(fileName || file?.name) && (
          <div className="animate-fade-in-up delay-200">
            <FileCard
              name={fileName || file?.name}
              size={fileSize || file?.size || 0}
              mimeType={fileType || file?.type}
            />
          </div>
        )}

        {(isTransferring || isComplete) && (
          <div className="glass border border-border rounded-sm p-6 animate-fade-in-up">
            <ProgressBar />
          </div>
        )}

        {isComplete && (
          <div className="glass border border-accent/30 bg-accent/5 rounded-sm p-5 animate-fade-in flex items-center gap-4">
            <div className="w-10 h-10 bg-accent/10 border border-accent/30 rounded-sm flex items-center justify-center flex-shrink-0">
              <span className="text-accent font-display font-bold">✓</span>
            </div>
            <div>
              <p className="font-display font-bold text-white">SHA-256 Verified</p>
              <p className="text-muted text-xs font-mono mt-0.5">Every chunk passed integrity check. Zero corruption.</p>
            </div>
          </div>
        )}

        {transferStatus === 'error' && (
          <div className="glass border border-red-400/30 bg-red-400/5 rounded-sm p-6 animate-fade-in space-y-3">
            <p className="font-display font-bold text-red-400">Transfer Failed</p>
            <p className="text-muted text-sm font-mono">{errorMessage}</p>
            <button onClick={() => navigate('/')} className="btn-ghost">Start Over</button>
          </div>
        )}

        {transferStatus === 'disconnected' && (
          <div className="glass border border-yellow-400/30 bg-yellow-400/5 rounded-sm p-6 animate-fade-in space-y-3">
            <p className="font-display font-bold text-yellow-400">Peer Disconnected</p>
            <p className="text-muted text-sm">The other side closed the connection.</p>
            <button onClick={() => navigate('/')} className="btn-ghost">Back to Home</button>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full transition-all duration-500
              ${peerConnected ? 'bg-accent animate-pulse' : 'bg-ghost'}`} />
            <span className="font-mono text-xs text-muted uppercase tracking-widest">
              {peerConnected ? 'P2P Active' : 'Waiting'}
            </span>
          </div>
          <span className="font-mono text-xs text-ghost uppercase tracking-widest">
            {peerConnected ? 'WebRTC DataChannel' : 'No peer yet'}
          </span>
        </div>
      </main>
    </div>
  )
}