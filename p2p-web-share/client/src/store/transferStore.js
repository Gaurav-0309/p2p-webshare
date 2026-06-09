import { create } from 'zustand'

const useTransferStore = create((set, get) => ({
  roomId: null,
  role: null,
  peerConnected: false,

  file: null,
  fileName: null,
  fileSize: 0,
  fileType: null,

  transferStatus: 'idle',
  progress: 0,
  speed: 0,
  transferredBytes: 0,
  startTime: null,
  errorMessage: null,
  chunksVerified: 0,
  totalChunks: 0,

  encryptionKey: null,
  encryptionEnabled: false,

  lastVerifiedChunk: -1,

  connectionStatus: 'disconnected',

  setRoom: (roomId, role) => set({ roomId, role }),

  setFile: (file) => set({
    file,
    fileName: file?.name ?? null,
    fileSize: file?.size ?? 0,
    fileType: file?.type ?? null,
  }),

  setFileInfo: (info) => set({
    fileName: info.name,
    fileSize: info.size,
    fileType: info.type,
  }),

  setPeerConnected: (peerConnected) => set({ peerConnected }),
  setConnectionStatus: (s) => set({ connectionStatus: s }),

  setEncryption: (key, enabled = true) => set({
    encryptionKey: key,
    encryptionEnabled: enabled,
  }),

  startTransfer: (totalChunks = 0) => set({
    transferStatus: 'transferring',
    startTime: Date.now(),
    totalChunks,
    chunksVerified: 0,
    lastVerifiedChunk: -1,
  }),

  updateProgress: (transferredBytes) => {
    const { fileSize, startTime } = get()
    const elapsed = (Date.now() - startTime) / 1000
    const speed = elapsed > 0.1 ? transferredBytes / elapsed : 0
    const progress = fileSize > 0 ? Math.min(transferredBytes / fileSize, 1) : 0
    set({ progress, speed, transferredBytes })
  },

  markChunkVerified: (index) => {
    const { chunksVerified } = get()
    set({ chunksVerified: chunksVerified + 1, lastVerifiedChunk: index })
  },

  setTransferComplete: () => set({
    transferStatus: 'complete',
    progress: 1,
    speed: 0,
  }),

  setError: (errorMessage) => set({ transferStatus: 'error', errorMessage }),

  setPeerDisconnected: () => set({
    peerConnected: false,
    connectionStatus: 'disconnected',
    transferStatus: get().transferStatus === 'complete' ? 'complete' : 'disconnected',
  }),

  reset: () => set({
    roomId: null,
    role: null,
    peerConnected: false,
    file: null,
    fileName: null,
    fileSize: 0,
    fileType: null,
    transferStatus: 'idle',
    progress: 0,
    speed: 0,
    transferredBytes: 0,
    startTime: null,
    errorMessage: null,
    chunksVerified: 0,
    totalChunks: 0,
    encryptionKey: null,
    encryptionEnabled: false,
    lastVerifiedChunk: -1,
    connectionStatus: 'disconnected',
  }),
}))

export default useTransferStore