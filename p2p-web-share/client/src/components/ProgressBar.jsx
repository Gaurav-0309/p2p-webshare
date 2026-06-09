import { useRef, useEffect, useState } from 'react'
import useTransferStore from '../store/transferStore'
import { formatBytes, formatSpeed } from '../utils/chunker'

export default function ProgressBar() {
  const { progress, speed, transferredBytes, fileSize, transferStatus, chunksVerified, totalChunks } = useTransferStore()
  const isComplete = transferStatus === 'complete'
  const isTransferring = transferStatus === 'transferring'
  const percent = Math.min(Math.round(progress * 100), 100)

  const speedSamples = useRef([])
  const [smoothSpeed, setSmoothSpeed] = useState(0)

  useEffect(() => {
    if (speed > 0) {
      speedSamples.current.push(speed)
      if (speedSamples.current.length > 8) speedSamples.current.shift()
      const avg = speedSamples.current.reduce((a, b) => a + b, 0) / speedSamples.current.length
      setSmoothSpeed(avg)
    }
  }, [speed])

  const remaining = fileSize - transferredBytes
  const eta = smoothSpeed > 0 && !isComplete ? Math.ceil(remaining / smoothSpeed) : 0

  const formatEta = (s) => {
    if (s <= 0) return ''
    if (s < 60) return `${s}s left`
    if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s left`
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m left`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted uppercase tracking-widest">
            {isComplete ? 'Transfer Complete' : 'Transferring'}
          </span>
          {isTransferring && <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />}
        </div>
        <span className="font-display font-bold text-white text-2xl">
          {percent}<span className="text-muted text-sm font-mono">%</span>
        </span>
      </div>

      <div className="relative h-1.5 bg-ghost rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
        {isTransferring && (
          <div className="absolute left-0 top-0 h-full animate-shimmer rounded-full"
            style={{ width: `${percent}%` }} />
        )}
      </div>

      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-4">
          <span className="text-muted">
            {formatBytes(transferredBytes)}
            <span className="text-ghost mx-1">/</span>
            {formatBytes(fileSize)}
          </span>
          {smoothSpeed > 0 && !isComplete && (
            <span className="text-accent font-semibold">{formatSpeed(smoothSpeed)}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-ghost">
          {eta > 0 && <span>{formatEta(eta)}</span>}
          {isComplete && <span className="text-accent uppercase tracking-widest">Done ✓</span>}
        </div>
      </div>

      {totalChunks > 0 && (
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-[11px] font-mono text-ghost">
            <span>SHA-256 verified</span>
            <span className="text-muted">{chunksVerified} / {totalChunks} chunks</span>
          </div>
          <ChunkVisualizer total={totalChunks} verified={chunksVerified} />
        </div>
      )}
    </div>
  )
}

function ChunkVisualizer({ total, verified }) {
  const MAX_BLOCKS = 80
  const blocks = Math.min(total, MAX_BLOCKS)
  const scale = total / blocks

  return (
    <div className="flex gap-px mt-2 h-1.5 overflow-hidden rounded-full">
      {Array.from({ length: blocks }).map((_, i) => {
        const chunkIndex = Math.floor(i * scale)
        const isVerified = chunkIndex < verified
        return (
          <div key={i}
            className={`flex-1 rounded-full transition-colors duration-150
              ${isVerified ? 'bg-accent/60' : 'bg-ghost/40'}`}
          />
        )
      })}
    </div>
  )
}