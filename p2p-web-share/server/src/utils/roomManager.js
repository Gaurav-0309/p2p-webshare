/**
 * roomManager.js — In-memory room state management
 * Tracks which socket IDs are in which rooms.
 * Simple Map-based store — no database needed.
 */

// Map<roomId, Set<socketId>>
const rooms = new Map()

/**
 * Create a new room with a unique ID.
 * @param {string} roomId
 * @param {string} socketId — the creator's socket ID
 */
function createRoom(roomId, socketId) {
  rooms.set(roomId, new Set([socketId]))
}

/**
 * Add a socket to an existing room.
 * @param {string} roomId
 * @param {string} socketId
 * @returns {boolean} true if successfully joined
 */
function joinRoom(roomId, socketId) {
  const room = rooms.get(roomId)
  if (!room) return false
  if (room.size >= 2) return false // Only allow 2 peers for MVP
  room.add(socketId)
  return true
}

/**
 * Remove a socket from all rooms it belongs to.
 * @param {string} socketId
 * @returns {string[]} roomIds that were affected
 */
function removeSocket(socketId) {
  const affected = []
  for (const [roomId, members] of rooms.entries()) {
    if (members.has(socketId)) {
      members.delete(socketId)
      affected.push(roomId)
      // Clean up empty rooms
      if (members.size === 0) {
        rooms.delete(roomId)
      }
    }
  }
  return affected
}

/**
 * Get all socket IDs in a room.
 * @param {string} roomId
 * @returns {string[]}
 */
function getRoomMembers(roomId) {
  return [...(rooms.get(roomId) ?? [])]
}

/**
 * Check if a room exists and has space.
 * @param {string} roomId
 * @returns {'available' | 'full' | 'not-found'}
 */
function getRoomStatus(roomId) {
  const room = rooms.get(roomId)
  if (!room) return 'not-found'
  if (room.size >= 2) return 'full'
  return 'available'
}

module.exports = {
  createRoom,
  joinRoom,
  removeSocket,
  getRoomMembers,
  getRoomStatus,
}
