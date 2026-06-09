import { useState, useCallback, useRef } from 'react'
import { Upload, AlertCircle, Lock, LockOpen } from 'lucide-react'
import { formatBytes } from '../utils/chunker'
import { generateEncryptionKey } from '../utils/crypto'
import useTransferStore from '../store/transferStore'

const LARGE_FILE_WARNING = 200 * 1024 * 1024

export default function DropZone({ onFile }) {
  const [isDragging, setIsDragging] = useState(false)
  const [warning, setWarning] = useState(null)
  const inputRef = useRef(null)
  const { file, setFile, encryptionEnabled, setEncryption } = useTransferStore()

  const processFile = useCallback((f) => {
    setWarning(null)
    if (f.size > LARGE_FILE_WARNING) {
      setWarning(`Large file (${formatBytes(f.size)}) — will use disk-based transfer to avoid RAM limits.`)
    }
    setFile(f)
    onFile?.(f)
  }, [setFile, onFile])

  const toggleEncryption = useCallback(async () => {
    if (encryptionEnabled) {
      setEncryption(null, false)
    } else {
      const key = await generateEncryptionKey()
      setEncryption(key, true)
    }
  }, [encryptionEnabled, setEncryption])

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false) }
  const onDrop = (e) => {
    e.preventDefault(); setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) processFile(dropped)
  }
  const onInputChange = (e) => {
    const selected = e.target.files[0]
    if (selected) processFile(selected)
  }

  if (file) {
    return (
      <div className="space-y-3">
        <div className="relative border border-accent/40 bg-accent/5 rounded-sm p-5 animate-fade-in">
          <div className="absolute inset-0 animate-shimmer rounded-sm pointer-events-none" />
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-accent/10 border border-accent/30 rounded-sm flex items-center justify-center flex-shrink-0">
              <Upload size={18} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-white text-sm truncate">{file.name}</p>
              <p className="font-mono text-xs text-muted mt-0.5">{formatBytes(file.size)}</p>
            </div>
            <button
              onClick={() => { setFile(null); setWarning(null) }}
              className="text-muted hover:text-accent transition-colors text-xs font-mono uppercase tracking-widest flex-shrink-0"
            >
              Change
            </button>
          </div>
        </div>

        <button
          onClick={toggleEncryption}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-sm border transition-all duration-200
            ${encryptionEnabled
              ? 'border-accent/40 bg-accent/5 text-accent'
              : 'border-border bg-panel text-muted hover:border-accent/30 hover:text-white'}`}
        >
          <div className="flex items-center gap-3">
            {encryptionEnabled ? <Lock size={14} /> : <LockOpen size={14} />}
            <div className="text-left">
              <p className="font-mono text-xs uppercase tracking-widest">
                {encryptionEnabled ? 'AES-256 Encryption ON' : 'Encryption OFF'}
              </p>
              <p className="font-mono text-[10px] text-ghost mt-0.5">
                {encryptionEnabled
                  ? 'Key travels only via URL hash — server never sees it'
                  : 'Enable zero-knowledge end-to-end encryption'}
              </p>
            </div>
          </div>
          <div className={`w-8 h-4 rounded-full transition-colors duration-200 relative flex-shrink-0
            ${encryptionEnabled ? 'bg-accent' : 'bg-ghost'}`}>
            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200
              ${encryptionEnabled ? 'left-4' : 'left-0.5'}`} />
          </div>
        </button>

        {warning && (
          <div className="flex items-start gap-2 text-yellow-400 text-xs font-mono animate-fade-in">
            <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
            <span>{warning}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div
        className={`relative border-2 border-dashed rounded-sm p-10
          flex flex-col items-center justify-center gap-4 cursor-pointer
          transition-all duration-300 group
          ${isDragging ? 'border-accent bg-accent/5 scale-[1.01]' : 'border-ghost hover:border-accent/50 hover:bg-accent/[0.02]'}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2',
          'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((cls, i) => (
          <div key={i} className={`absolute w-4 h-4 transition-colors duration-300
            ${cls} ${isDragging ? 'border-accent' : 'border-muted group-hover:border-accent/60'}`} />
        ))}

        <div className={`w-14 h-14 rounded-sm border flex items-center justify-center transition-all duration-300
          ${isDragging ? 'border-accent bg-accent/10 scale-110' : 'border-ghost group-hover:border-accent/40'}`}>
          <Upload size={24} className={`transition-colors duration-300 ${isDragging ? 'text-accent' : 'text-muted group-hover:text-accent/60'}`} />
        </div>

        <div className="text-center">
          <p className="font-display font-semibold text-white mb-1">
            {isDragging ? 'Drop it.' : 'Drop your file here'}
          </p>
          <p className="text-muted text-sm font-body">
            or <span className="text-accent underline underline-offset-2">browse</span> to select
          </p>
          <p className="text-xs font-mono text-ghost mt-3 uppercase tracking-widest">
            Any size — no limits
          </p>
        </div>
        <input ref={inputRef} type="file" className="hidden" onChange={onInputChange} />
      </div>
    </div>
  )
}