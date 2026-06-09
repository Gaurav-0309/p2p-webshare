/**
 * useSocket.js — Socket.io connection hook
 * Provides a singleton socket instance across the app.
 */
import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

// Singleton socket — shared across all hook instances
let socketInstance = null

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SERVER_URL, {
      autoConnect: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
  }
  return socketInstance
}

/**
 * useSocket — connect/disconnect lifecycle + event registration
 * @param {Record<string, Function>} eventHandlers — socket event → handler map
 * @returns {{ socket: Socket }}
 */
export function useSocket(eventHandlers = {}) {
  const socket = getSocket()
  const handlersRef = useRef(eventHandlers)
  handlersRef.current = eventHandlers

  useEffect(() => {
    // Connect on mount
    if (!socket.connected) {
      socket.connect()
    }

    // Register all provided handlers
    const entries = Object.entries(handlersRef.current)
    entries.forEach(([event, handler]) => {
      socket.on(event, (...args) => handlersRef.current[event]?.(...args))
    })

    return () => {
      // Clean up handlers on unmount
      entries.forEach(([event]) => socket.off(event))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { socket }
}
