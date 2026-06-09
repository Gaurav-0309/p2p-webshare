/**
 * nanoid.js — Minimal URL-safe random ID generator.
 * Avoids needing the nanoid npm package (ESM-only issues with CommonJS).
 */
const { randomBytes } = require('crypto')

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

/**
 * Generate a random URL-safe ID.
 * @param {number} size
 * @returns {string}
 */
function nanoid(size = 8) {
  const bytes = randomBytes(size)
  return Array.from(bytes)
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join('')
}

module.exports = { nanoid }
