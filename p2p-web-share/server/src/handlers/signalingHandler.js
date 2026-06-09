/**
 * signalingHandler.js — WebRTC Signaling relay
 *
 * The server acts ONLY as a postman here.
 * It receives offer/answer/ICE from one peer and forwards to the other.
 * It never inspects or stores the content — it's just routing.
 */

/**
 * Register signaling event handlers.
 * @param {Socket} socket
 * @param {Server} io
 */
function registerSignalingHandlers(socket, io) {
  /**
   * offer — Sender sends their WebRTC offer.
   * Relay it to everyone else in the room (the receiver).
   */
  socket.on('offer', ({ roomId, offer }) => {
    console.log(`[Signal] Offer from ${socket.id} → room ${roomId}`)
    socket.to(roomId).emit('offer', { offer })
  })

  /**
   * answer — Receiver sends their WebRTC answer.
   * Relay it to everyone else in the room (the sender).
   */
  socket.on('answer', ({ roomId, answer }) => {
    console.log(`[Signal] Answer from ${socket.id} → room ${roomId}`)
    socket.to(roomId).emit('answer', { answer })
  })

  /**
   * ice-candidate — Either peer sends an ICE candidate.
   * Relay it to the other peer in the room.
   */
  socket.on('ice-candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('ice-candidate', { candidate })
  })
}

module.exports = { registerSignalingHandlers }
