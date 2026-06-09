export async function hashChunk(chunk) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', chunk)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyChunk(chunk, expectedHash) {
  const actualHash = await hashChunk(chunk)
  return actualHash === expectedHash
}

export function generateRoomId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(8)
  crypto.getRandomValues(array)
  return Array.from(array).map((b) => chars[b % chars.length]).join('')
}

export async function generateEncryptionKey() {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function exportKeyToString(key) {
  const raw = await crypto.subtle.exportKey('raw', key)
  return btoa(String.fromCharCode(...new Uint8Array(raw)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function importKeyFromString(keyStr) {
  const padded = keyStr.replace(/-/g, '+').replace(/_/g, '/')
  const raw = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey(
    'raw', raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptChunk(chunk, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    chunk
  )
  return { iv, ciphertext }
}

export async function decryptChunk(ciphertext, iv, key) {
  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )
}

export function packEncryptedChunk(iv, ciphertext) {
  const packed = new Uint8Array(12 + ciphertext.byteLength)
  packed.set(iv, 0)
  packed.set(new Uint8Array(ciphertext), 12)
  return packed.buffer
}

export function unpackEncryptedChunk(packed) {
  const buf = packed instanceof ArrayBuffer ? packed : packed.buffer
  const iv = new Uint8Array(buf, 0, 12)
  const ciphertext = buf.slice(12)
  return { iv, ciphertext }
}