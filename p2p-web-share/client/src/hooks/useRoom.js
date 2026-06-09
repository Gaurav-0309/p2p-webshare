/**
 * useRoom.js — Room lifecycle management
 * Handles creating rooms (sender) and joining rooms (receiver).
 */
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSocket } from './useSocket'
import useTransferStore from '../store/transferStore'

export function useRoom() {
  const navigate = useNavigate()
  const { setRoom } = useTransferStore()
  const socket = getSocket()

  /**
   * Create a new room as the sender.
   * Server responds with a unique roomId.
   */
  const createRoom = useCallback(() => {
    if (!socket.connected) socket.connect()

    socket.emit('create-room', (response) => {
      if (response.error) {
        console.error('Failed to create room:', response.error)
        return
      }
      const { roomId } = response
      setRoom(roomId, 'sender')
      navigate(`/room/${roomId}`)
    })
  }, [socket, setRoom, navigate])

  /**
   * Join an existing room as the receiver.
   * @param {string} roomId
   */
  const joinRoom = useCallback((roomId) => {
    if (!socket.connected) socket.connect()

    socket.emit('join-room', { roomId }, (response) => {
      if (response.error) {
        console.error('Failed to join room:', response.error)
        return
      }
      setRoom(roomId, 'receiver')
    })
  }, [socket, setRoom])

  return { createRoom, joinRoom }
}
