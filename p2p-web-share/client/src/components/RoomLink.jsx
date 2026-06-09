import { useState, useEffect } from 'react'
import { Copy, Check, Link, Lock } from 'lucide-react'
import useTransferStore from '../store/transferStore'
import { exportKeyToString } from '../utils/crypto'

export default function RoomLink({ roomId }) {
  const [copied, setCopied] = useState(false)
  const [fullUrl, setFullUrl] = useState('')
  const { encryptionEnabled, encryptionKey } = useTransferStore()

  const buildUrl = async () => {
    const base = `${window.location.origin}/room/${roomId}`
    if (encryptionEnabled && encryptionKey) {
      const keyStr = await exportKeyToString(encryptionKey)
      return `${base}#key=${keyStr}`
    }
    return base
  }

  useEffect(() => {
    buildUrl().then(setFullUrl)
  }, [roomId, encryptionEnabled, encryptionKey])

  const copyLink = async () => {
    const url = await buildUrl()
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayUrl = fullUrl || `${window.location.origin}/room/${roomId}`

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-mono text-muted uppercase tracking-widest">
        <Link size={12} />
        <span>Share this link with the recipient</span>
        {encryptionEnabled && <Lock size={10} className="text-accent" />}
      </div>

      <div className="flex items-stretch gap-2">
        <div className="flex-1 bg-panel border border-border rounded-sm px-4 py-3 overflow-hidden">
          <span className="font-mono text-sm text-white/60 truncate block">
            {displayUrl.length > 60 ? displayUrl.slice(0, 60) + '...' : displayUrl}
          </span>
        </div>
        <button
          onClick={copyLink}
          className={`flex items-center gap-2 px-4 py-3 rounded-sm border font-mono
            transition-all duration-200 active:scale-95 flex-shrink-0
            ${copied
              ? 'bg-accent/10 border-accent text-accent'
              : 'border-border text-muted hover:border-accent/50 hover:text-accent'}`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span className="uppercase tracking-widest text-xs">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-ghost uppercase tracking-widest">Room:</span>
          <span className="font-mono text-xs text-accent bg-accent/10 px-2 py-1 rounded-sm border border-accent/20">
            {roomId}
          </span>
        </div>
        {encryptionEnabled && (
          <div className="flex items-center gap-1 text-xs font-mono text-accent/60">
            <Lock size={10} />
            <span>Key in URL hash</span>
          </div>
        )}
      </div>
    </div>
  )
}