export const LARGE_FILE_THRESHOLD = 200 * 1024 * 1024 // 200MB

export function isOPFSAvailable() {
  return typeof navigator !== 'undefined' &&
    'storage' in navigator &&
    'getDirectory' in navigator.storage
}

export class OPFSWriter {
  constructor(fileName, mimeType, totalChunks, totalSize) {
    this.fileName = fileName
    this.mimeType = mimeType
    this.totalChunks = totalChunks
    this.totalSize = totalSize
    this.receivedCount = 0
    this.bytesReceived = 0
    this.fileHandle = null
    this.writable = null
    this._ready = this._init()
  }

  async _init() {
    const root = await navigator.storage.getDirectory()
    const tempName = `p2p_transfer_${Date.now()}_${this.fileName}`
    this.fileHandle = await root.getFileHandle(tempName, { create: true })
    this.writable = await this.fileHandle.createWritable()
    console.log('[OPFS] Writer initialized for:', this.fileName)
  }

  async waitReady() { await this._ready }

  async writeChunk(index, data) {
    await this._ready
    const CHUNK_SIZE = 256 * 1024
    const offset = index * CHUNK_SIZE
    await this.writable.write({ type: 'write', position: offset, data })
    this.receivedCount++
    this.bytesReceived += data.byteLength
  }

  isComplete() { return this.receivedCount === this.totalChunks }
  getBytesReceived() { return this.bytesReceived }

  async download() {
    await this.writable.close()
    const file = await this.fileHandle.getFile()
    const blob = new Blob([file], { type: this.mimeType || 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = this.fileName
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    try {
      const root = await navigator.storage.getDirectory()
      await root.removeEntry(this.fileHandle.name)
    } catch (_) {}
  }
}