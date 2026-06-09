import { Wifi, WifiOff, Loader, XCircle } from 'lucide-react'
import useTransferStore from '../store/transferStore'

const STATUS_CONFIG = {
  disconnected: { icon: WifiOff, label: 'Waiting for peer',         color: 'text-muted',    dotColor: 'bg-ghost',    pulse: false },
  connecting:   { icon: Loader,  label: 'Establishing connection',   color: 'text-yellow-400', dotColor: 'bg-yellow-400', pulse: true, spin: true },
  connected:    { icon: Wifi,    label: 'Peer connected',            color: 'text-accent',   dotColor: 'bg-accent',   pulse: true },
  failed:       { icon: XCircle, label: 'Connection failed',         color: 'text-red-400',  dotColor: 'bg-red-400',  pulse: false },
}

export default function ConnectionStatus() {
  const { connectionStatus } = useTransferStore()
  const config = STATUS_CONFIG[connectionStatus] || STATUS_CONFIG.disconnected
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-3 ${config.color} transition-all duration-500`}>
      <div className="relative flex-shrink-0">
        <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
        {config.pulse && (
          <div className={`absolute inset-0 rounded-full ${config.dotColor} animate-ping opacity-40`} />
        )}
      </div>
      <Icon size={14} className={`flex-shrink-0 ${config.spin ? 'animate-spin' : ''}`} />
      <span className="font-mono text-xs uppercase tracking-widest">{config.label}</span>
    </div>
  )
}