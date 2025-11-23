import { useConnectionState, ConnectionState } from '@/contexts/WebSocketContext'

interface ConnectionStatusProps {
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const stateConfig: Record<ConnectionState, { color: string; label: string; icon: string }> = {
  connected: {
    color: 'bg-green-500',
    label: 'Connected',
    icon: '●',
  },
  connecting: {
    color: 'bg-yellow-500 animate-pulse',
    label: 'Connecting',
    icon: '◐',
  },
  disconnected: {
    color: 'bg-red-500',
    label: 'Disconnected',
    icon: '●',
  },
  offline: {
    color: 'bg-gray-500',
    label: 'Offline',
    icon: '○',
  },
}

const sizeConfig = {
  sm: {
    dot: 'w-2 h-2',
    text: 'text-xs',
    gap: 'gap-1',
  },
  md: {
    dot: 'w-2.5 h-2.5',
    text: 'text-sm',
    gap: 'gap-1.5',
  },
  lg: {
    dot: 'w-3 h-3',
    text: 'text-base',
    gap: 'gap-2',
  },
}

export default function ConnectionStatus({ showLabel = true, size = 'sm' }: ConnectionStatusProps) {
  const connectionState = useConnectionState()
  const config = stateConfig[connectionState]
  const sizeStyles = sizeConfig[size]

  return (
    <div className={`flex items-center ${sizeStyles.gap}`} title={config.label}>
      <span className={`${sizeStyles.dot} rounded-full ${config.color}`} />
      {showLabel && (
        <span className={`${sizeStyles.text} text-gray-500`}>
          {config.label}
        </span>
      )}
    </div>
  )
}

// Compact version for use in headers/footers
export function ConnectionStatusDot() {
  const connectionState = useConnectionState()
  const config = stateConfig[connectionState]

  return (
    <span
      className={`w-2 h-2 rounded-full ${config.color}`}
      title={config.label}
    />
  )
}
