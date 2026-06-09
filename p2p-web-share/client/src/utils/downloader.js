export function downloadFile(chunks, fileName, mimeType) {
  const blob = new Blob(chunks, { type: mimeType || 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export class ChunkBuffer {
  constructor(totalChunks, fileName, mimeType, totalSize = 0) {
    this.totalChunks = totalChunks
    this.fileName = fileName
    this.mimeType = mimeType
    this.totalSize = totalSize
    this.chunks = new Array(totalChunks).fill(null)
    this.receivedCount = 0
    this.bytesReceived = 0
  }

  addChunk(index, data) {
    if (this.chunks[index] !== null) return false
    this.chunks[index] = data
    this.receivedCount++
    this.bytesReceived += data.byteLength
    return this.isComplete()
  }

  isComplete() { return this.receivedCount === this.totalChunks }
  getProgress() { return this.receivedCount / this.totalChunks }
  getBytesReceived() { return this.bytesReceived }

  download() {
    if (!this.isComplete()) throw new Error('Not all chunks received yet')
    downloadFile(this.chunks, this.fileName, this.mimeType)
  }
}