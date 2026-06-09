export const CHUNK_SIZE = 256 * 1024 // 256KB

export function getTotalChunks(file) {
  return Math.ceil(file.size / CHUNK_SIZE)
}

export function readChunk(file, chunkIndex) {
  return new Promise((resolve, reject) => {
    const start = chunkIndex * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const blob = file.slice(start, end)
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = (e) => reject(e.target.error)
    reader.readAsArrayBuffer(blob)
  })
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatSpeed(bytesPerSecond) {
  if (bytesPerSecond === 0) return '0 B/s'
  const k = 1024
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k))
  return `${parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function getFileCategory(mimeType) {
  if (!mimeType) return 'file'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.includes('pdf')) return 'pdf'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive'
  if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('xml')) return 'text'
  return 'file'
}