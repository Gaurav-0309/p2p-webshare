/**
 * roomHandler.js — Handles room creation and joining events.
 */
const { createRoom, joinRoom, getRoomMembers, getRoomStatus } = require('../utils/roomManager')
const { nanoid } = require('../utils/nanoid')

/**
 * Register room-related socket event handlers.
 * @param {Socket} socket
 * @param {Server} io
 */
function registerRoomHandlers(socket, io) {
  /**
   * create-room — Sender calls this to create a new transfer room.
   * Responds with a unique roomId.
   */
  socket.on('create-room', (callback) => {
    const roomId = nanoid(8)
    createRoom(roomId, socket.id)
    socket.join(roomId) // Join Socket.io room for broadcasting

    console.log(`[Room] Created: ${roomId} by socket ${socket.id}`)
    callback({ roomId })
  })

  /**
   * join-room — Receiver calls this when they open the share link.
   * Notifies the sender that someone has joined.
   */
  socket.on('join-room', ({ roomId }, callback) => {
    const status = getRoomStatus(roomId)

    if (status === 'not-found') {
      console.log(`[Room] Join failed — room not found: ${roomId}`)
      return callback({ error: 'Room not found' })
    }

    if (status === 'full') {
      console.log(`[Room] Join failed — room full: ${roomId}`)
      return callback({ error: 'Room is full' })
    }

    const joined = joinRoom(roomId, socket.id)
    if (!joined) {
      return callback({ error: 'Could not join room' })
    }

    socket.join(roomId)
    console.log(`[Room] ${socket.id} joined room ${roomId}`)

    // Tell the sender that the receiver has arrived
    socket.to(roomId).emit('peer-joined', { socketId: socket.id })

    callback({ success: true, roomId })
  })
}

module.exports = { registerRoomHandlers }
