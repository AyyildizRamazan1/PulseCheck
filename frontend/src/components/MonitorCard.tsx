import { Globe, Clock, Zap, ChevronRight } from 'lucide-react'
import { Monitor } from '../pages/Dashboard'

interface Props {
  monitor: Monitor
  isSelected: boolean
  onClick: () => void
}

const statusBadge: Record<string, string> = {
  UP:      'bg-green-500/20 text-green-400 border border-green-500/30',
  DOWN:    'bg-red-500/20 text-red-400 border border-red-500/30',
  TIMEOUT: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  ERROR:   'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  UNKNOWN: 'bg-gray-500/20 text-gray-400 border border-gray-600',
}

export default function MonitorCard({ monitor, isSelected, onClick }: Props) {
  const status = monitor.lastStatus ?? 'UNKNOWN'

  return (
    <button
      onClick={onClick}
      className={`w-full text-left card hover:border-gray-600 transition-all cursor-pointer ${
        isSelected ? 'border-primary-500/60 bg-gray-800/60' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="font-medium truncate">{monitor.name}</span>
          </div>
          <p className="text-xs text-gray-500 truncate mb-3">{monitor.url}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {monitor.checkIntervalSeconds}s
            </span>
            {monitor.lastResponseMs != null && (
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {monitor.lastResponseMs}ms
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[status]}`}>
            {status}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </div>
      </div>
    </button>
  )
}