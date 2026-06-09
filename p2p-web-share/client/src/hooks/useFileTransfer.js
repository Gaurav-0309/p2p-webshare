import { useCallback, useRef } from 'react'
import { hashChunk, verifyChunk, encryptChunk, decryptChunk, packEncryptedChunk, unpackEncryptedChunk } from '../utils/crypto'
import { readChunk, getTotalChunks } from '../utils/chunker'
import { ChunkBuffer } from '../utils/downloader'
import { OPFSWriter, isOPFSAvailable, LARGE_FILE_THRESHOLD } from '../utils/opfsWriter'
import useTransferStore from '../store/transferStore'

export function useFileTransfer() {
  const bufferRef = useRef(null)

  const sendFile = useCallback(async (dataChannel, fileToSend, resumeFromChunk = -1) => {
    const store = useTransferStore.getState()
    const targetFile = fileToSend || store.file

    if (!targetFile) { store.setError('No file selected'); return }
    if (!dataChannel || dataChannel.readyState !== 'open') {
      store.setError('Data channel is not open'); return
    }

    const { encryptionKey, encryptionEnabled } = store
    const totalChunks = getTotalChunks(targetFile)
    const startChunk = resumeFromChunk + 1

    store.startTransfer(totalChunks)
    console.log(`[Transfer] Sending "${targetFile.name}" — ${totalChunks} chunks, encrypted: ${encryptionEnabled}, resuming from: ${startChunk}`)

    dataChannel.send(JSON.stringify({
      type: 'metadata',
      name: targetFile.name,
      size: targetFile.size,
      mimeType: targetFile.type,
      totalChunks,
      encrypted: encryptionEnabled,
      resumeFrom: startChunk,
    }))

    let bytesSent = startChunk > 0 ? Math.min(startChunk * 256 * 1024, targetFile.size) : 0

    for (let i = startChunk; i < totalChunks; i++) {
      if (dataChannel.readyState !== 'open') {
        useTransferStore.getState().setError('Connection lost during transfer')
        return
      }

      let chunkData = await readChunk(targetFile, i)

      if (encryptionEnabled && encryptionKey) {
        const { iv, ciphertext } = await encryptChunk(chunkData, encryptionKey)
        const hash = await hashChunk(chunkData)
        const packed = packEncryptedChunk(iv, ciphertext)

        dataChannel.send(JSON.stringify({
          type: 'chunk-header',
          index: i,
          hash,
          size: packed.byteLength,
          encrypted: true,
        }))
        dataChannel.send(packed)
      } else {
        const hash = await hashChunk(chunkData)
        dataChannel.send(JSON.stringify({
          type: 'chunk-header',
          index: i,
          hash,
          size: chunkData.byteLength,
          encrypted: false,
        }))
        dataChannel.send(chunkData)
      }

      bytesSent += chunkData.byteLength
      useTransferStore.getState().updateProgress(bytesSent)
      await waitForBufferDrain(dataChannel)
    }

    dataChannel.send(JSON.stringify({ type: 'transfer-complete' }))
    useTransferStore.getState().setTransferComplete()
    console.log('[Transfer] All chunks sent ✓')
  }, [])

  const receiveFile = useCallback((dataChannel) => {
    let pendingHeader = null
    dataChannel.binaryType = 'arraybuffer'

    dataChannel.onmessage = async ({ data }) => {
      if (typeof data === 'string') {
        let message
        try { message = JSON.parse(data) }
        catch { console.error('[Transfer] Bad JSON:', data); return }

        switch (message.type) {
          case 'metadata': {
            const { name, size, mimeType, totalChunks, encrypted, resumeFrom = 0 } = message
            const store = useTransferStore.getState()
            const useLargeFile = size > LARGE_FILE_THRESHOLD && isOPFSAvailable()

            if (useLargeFile) {
              console.log('[Transfer] Large file — using OPFS writer')
              bufferRef.current = new OPFSWriter(name, mimeType, totalChunks, size)
              await bufferRef.current.waitReady()
            } else {
              bufferRef.current = new ChunkBuffer(totalChunks, name, mimeType, size)
            }

            store.setFileInfo({ name, size, type: mimeType })
            store.startTransfer(totalChunks)
            console.log(`[Transfer] Receiving "${name}" (${totalChunks} chunks, encrypted: ${encrypted})`)
            break
          }

          case 'chunk-header': {
            pendingHeader = message
            break
          }

          case 'transfer-complete': {
            const buffer = bufferRef.current
            if (buffer?.isComplete()) {
              useTransferStore.getState().setTransferComplete()
              await buffer.download()
              console.log('[Transfer] Download triggered ✓')
            } else {
              console.warn('[Transfer] Got transfer-complete but buffer incomplete')
            }
            break
          }

          default:
            console.warn('[Transfer] Unknown message:', message.type)
        }

      } else {
        if (!pendingHeader) { console.error('[Transfer] Binary without header!'); return }

        const { index, hash, encrypted } = pendingHeader
        pendingHeader = null

        const store = useTransferStore.getState()
        const { encryptionKey } = store
        let plainChunk = data

        if (encrypted && encryptionKey) {
          try {
            const { iv, ciphertext } = unpackEncryptedChunk(data)
            plainChunk = await decryptChunk(ciphertext, iv, encryptionKey)
          } catch (err) {
            store.setError(`Chunk ${index} decryption failed — wrong key or corrupted data`)
            console.error('[Transfer] Decryption error:', err)
            return
          }
        }

        const isValid = await verifyChunk(plainChunk, hash)
        if (!isValid) {
          store.setError(`Chunk ${index} failed SHA-256 — data corrupted`)
          return
        }

        const buffer = bufferRef.current
        if (!buffer) return

        if (buffer instanceof OPFSWriter) {
          await buffer.writeChunk(index, plainChunk)
        } else {
          buffer.addChunk(index, plainChunk)
        }

        store.markChunkVerified(index)
        store.updateProgress(buffer.getBytesReceived())
      }
    }
  }, [])

  return { sendFile, receiveFile }
}

async function waitForBufferDrain(dc, threshold = 4 * 1024 * 1024) {
  while (dc.bufferedAmount > threshold) {
    await new Promise((r) => setTimeout(r, 30))
  }
}