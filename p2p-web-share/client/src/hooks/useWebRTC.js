import { useRef, useCallback, useEffect } from 'react'
import { getSocket } from './useSocket'
import useTransferStore from '../store/transferStore'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

export function useWebRTC({ roomId, role, onDataChannel }) {
  const pcRef = useRef(null)
  const dataChannelRef = useRef(null)
  const iceCandidateQueue = useRef([])
  const remoteDescSet = useRef(false)
  const initiatorStarted = useRef(false)
  const mountedRef = useRef(true)

  const roleRef = useRef(role)
  const onDataChannelRef = useRef(onDataChannel)
  useEffect(() => { roleRef.current = role }, [role])
  useEffect(() => { onDataChannelRef.current = onDataChannel }, [onDataChannel])

  const socket = getSocket()
  const { setPeerConnected, setPeerDisconnected, setConnectionStatus } = useTransferStore()

  const createPeerConnection = useCallback(() => {
    if (pcRef.current) pcRef.current.close()
    remoteDescSet.current = false
    iceCandidateQueue.current = []

    const pc = new RTCPeerConnection(ICE_SERVERS)
    pcRef.current = pc

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit('ice-candidate', { roomId, candidate })
    }

    pc.onconnectionstatechange = () => {
      if (!mountedRef.current) return
      const state = pc.connectionState
      console.log('[WebRTC] Connection state:', state)
      if (state === 'connected') {
        setConnectionStatus('connected')
        setPeerConnected(true)
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        setConnectionStatus(state === 'failed' ? 'failed' : 'disconnected')
        setPeerDisconnected()
      } else if (state === 'connecting') {
        setConnectionStatus('connecting')
      }
    }

    pc.onicegatheringstatechange = () => {
      console.log('[WebRTC] ICE gathering:', pc.iceGatheringState)
    }

    return pc
  }, [roomId, socket, setPeerConnected, setPeerDisconnected, setConnectionStatus])

  const flushIceCandidateQueue = useCallback(async () => {
    const pc = pcRef.current
    if (!pc) return
    console.log(`[WebRTC] Flushing ${iceCandidateQueue.current.length} queued ICE candidates`)
    for (const candidate of iceCandidateQueue.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (err) {
        console.error('[WebRTC] Error adding queued ICE candidate:', err)
      }
    }
    iceCandidateQueue.current = []
  }, [])

  const startAsInitiator = useCallback(async () => {
    if (initiatorStarted.current) {
      console.warn('[WebRTC] Duplicate startAsInitiator — ignoring')
      return
    }
    initiatorStarted.current = true

    const pc = createPeerConnection()
    const dc = pc.createDataChannel('file-transfer', { ordered: true })
    dataChannelRef.current = dc

    dc.onopen = () => {
      console.log('[WebRTC] Data channel open (sender)')
      onDataChannelRef.current?.(dc)
    }
    dc.onclose = () => console.log('[WebRTC] Data channel closed (sender)')
    dc.onerror = (e) => console.error('[WebRTC] Data channel error:', e)

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socket.emit('offer', { roomId, offer })
    console.log('[WebRTC] Offer sent')
  }, [createPeerConnection, roomId, socket])

  const handleOffer = useCallback(async ({ offer }) => {
    console.log('[WebRTC] Offer received')
    const pc = createPeerConnection()

    pc.ondatachannel = ({ channel }) => {
      dataChannelRef.current = channel
      channel.binaryType = 'arraybuffer'
      channel.onopen = () => {
        console.log('[WebRTC] Data channel open (receiver)')
        onDataChannelRef.current?.(channel)
      }
      channel.onclose = () => console.log('[WebRTC] Data channel closed (receiver)')
      channel.onerror = (e) => console.error('[WebRTC] Data channel error:', e)
    }

    try {
      await pc.setRemoteDescription(offer)
      remoteDescSet.current = true
      await flushIceCandidateQueue()

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('answer', { roomId, answer })
      console.log('[WebRTC] Answer sent')
    } catch (err) {
      console.error('[WebRTC] Error handling offer:', err)
    }
  }, [createPeerConnection, roomId, socket, flushIceCandidateQueue])

  const handleAnswer = useCallback(async ({ answer }) => {
    const pc = pcRef.current
    if (!pc) return
    console.log('[WebRTC] Answer received')
    try {
      await pc.setRemoteDescription(answer)
      remoteDescSet.current = true
      await flushIceCandidateQueue()
    } catch (err) {
      console.error('[WebRTC] Error handling answer:', err)
    }
  }, [flushIceCandidateQueue])

  const handleIceCandidate = useCallback(async ({ candidate }) => {
    if (!remoteDescSet.current) {
      console.log('[WebRTC] Queuing ICE candidate')
      iceCandidateQueue.current.push(candidate)
      return
    }
    const pc = pcRef.current
    if (!pc) return
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (err) {
      console.error('[WebRTC] Error adding ICE candidate:', err)
    }
  }, [])

  const closePeerConnection = useCallback(() => {
    dataChannelRef.current?.close()
    pcRef.current?.close()
    dataChannelRef.current = null
    pcRef.current = null
    initiatorStarted.current = false
    remoteDescSet.current = false
    iceCandidateQueue.current = []
    setPeerDisconnected()
  }, [setPeerDisconnected])

  useEffect(() => {
    if (!socket || !roomId) return

    const onPeerJoined = () => {
      console.log('[Room] Peer joined, role:', roleRef.current)
      if (roleRef.current === 'sender') {
        // Give the receiver a moment to set up listeners
        setTimeout(() => startAsInitiator(), 100)
      }
    }
    const onPeerLeft = () => {
      if (mountedRef.current) setPeerDisconnected()
    }

    // Register listeners IMMEDIATELY
    socket.on('peer-joined', onPeerJoined)
    socket.on('offer', handleOffer)
    socket.on('answer', handleAnswer)
    socket.on('ice-candidate', handleIceCandidate)
    socket.on('peer-left', onPeerLeft)

    return () => {
      socket.off('peer-joined', onPeerJoined)
      socket.off('offer', handleOffer)
      socket.off('answer', handleAnswer)
      socket.off('ice-candidate', handleIceCandidate)
      socket.off('peer-left', onPeerLeft)
    }
  }, [socket, roomId, handleOffer, handleAnswer, handleIceCandidate, startAsInitiator, setPeerDisconnected])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      pcRef.current?.close()
    }
  }, [])

  return { peerConnection: pcRef, dataChannel: dataChannelRef, closePeerConnection }
}