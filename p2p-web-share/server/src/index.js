const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const { registerRoomHandlers } = require('./handlers/roomHandler')
const { registerSignalingHandlers } = require('./handlers/signalingHandler')
const { removeSocket, getRoomMembers } = require('./utils/roomManager')

const app = express()
const server = http.createServer(app)

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'
const PORT = process.env.PORT || 3001

console.log('[Server] CLIENT_URL:', CLIENT_URL)
console.log('[Server] PORT:', PORT)

// Very permissive CORS — fixes all origin issues
app.use(cors({ origin: '*' }))
app.use(express.json())

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    clientUrl: CLIENT_URL,
    timestamp: new Date().toISOString()
  })
})

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`)

  registerRoomHandlers(socket, io)
  registerSignalingHandlers(socket, io)

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Disconnected: ${socket.id} (${reason})`)
    const affectedRooms = removeSocket(socket.id)
    affectedRooms.forEach((roomId) => {
      const remaining = getRoomMembers(roomId)
      if (remaining.length > 0) {
        io.to(roomId).emit('peer-left', { socketId: socket.id })
      }
    })
  })
})

server.listen(PORT, () => {
  console.log(`\n🚀 Signaling server running on port ${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/health`)
  console.log(`   Accepting connections from: ${CLIENT_URL}\n`)
})