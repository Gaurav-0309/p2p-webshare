/**
 * index.js — P2P WebShare Signaling Server
 *
 * This server does ONE thing: introduce two browsers to each other.
 * It relays WebRTC handshake messages (offer, answer, ICE candidates).
 * It NEVER touches, stores, or processes file data.
 *
 * Stack: Express + Socket.io
 */
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const { registerRoomHandlers } = require('./handlers/roomHandler')
const { registerSignalingHandlers } = require('./handlers/signalingHandler')
const { removeSocket, getRoomMembers } = require('./utils/roomManager')

// ─── App Setup ────────────────────────────────────────────────
const app = express()
const server = http.createServer(app)

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

const io = new Server(server, {
  cors: {
    origin: [CLIENT_URL, 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

app.use(cors({ origin: CLIENT_URL }))
app.use(express.json())

// ─── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── Socket.io Connection Handler ────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`)

  // Register all event handlers
  registerRoomHandlers(socket, io)
  registerSignalingHandlers(socket, io)

  // Handle disconnection — notify remaining peer in room
  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Disconnected: ${socket.id} (${reason})`)

    // Find which rooms this socket was in and notify remaining peers
    const affectedRooms = removeSocket(socket.id)
    affectedRooms.forEach((roomId) => {
      const remaining = getRoomMembers(roomId)
      if (remaining.length > 0) {
        io.to(roomId).emit('peer-left', { socketId: socket.id })
        console.log(`[Room] Notified ${remaining.length} peer(s) in ${roomId} of disconnection`)
      }
    })
  })
})

// ─── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`\n🚀 Signaling server running on port ${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/health`)
  console.log(`   Accepting connections from: ${CLIENT_URL}\n`)
})
