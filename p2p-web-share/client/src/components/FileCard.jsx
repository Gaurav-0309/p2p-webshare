import { File, Image, Video, Music, FileText, Archive, FileCode, Lock } from 'lucide-react'
import { formatBytes, getFileCategory } from '../utils/chunker'

const ICONS = {
  image:   { Icon: Image,    color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/20' },
  video:   { Icon: Video,    color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
  audio:   { Icon: Music,    color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  pdf:     { Icon: FileText, color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/20' },
  archive: { Icon: Archive,  color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' },
  text:    { Icon: FileCode, color: 'text-green-400',  bg: 'bg-green-400/10 border-green-400/20' },
  file:    { Icon: File,     color: 'text-muted',      bg: 'bg-ghost/50 border-ghost' },
}

export default function FileCard({ name, size, mimeType, encrypted }) {
  const category = getFileCategory(mimeType)
  const { Icon, color, bg } = ICONS[category] || ICONS.file
  const ext = name?.split('.').pop()?.toUpperCase() || 'FILE'

  return (
    <div className="flex items-center gap-4 glass rounded-sm p-4 border border-border">
      <div className={`w-12 h-12 rounded-sm border flex flex-col items-center justify-center flex-shrink-0 ${bg}`}>
        <Icon size={18} className={color} />
        <span className={`text-[8px] font-mono mt-0.5 uppercase ${color}`}>{ext.slice(0, 4)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-white text-sm truncate">{name}</p>
        <p className="font-mono text-xs text-muted mt-0.5">{formatBytes(size)}</p>
      </div>
      {encrypted && (
        <div className="flex items-center gap-1.5 border border-accent/30 bg-accent/5 rounded-sm px-2 py-1 flex-shrink-0">
          <Lock size={10} className="text-accent" />
          <span className="font-mono text-[10px] text-accent uppercase tracking-widest">AES-256</span>
        </div>
      )}
    </div>
  )
}