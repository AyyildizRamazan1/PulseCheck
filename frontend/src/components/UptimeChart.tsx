import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { CheckLog } from '../pages/Dashboard'

interface Props {
  logs: CheckLog[]
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const statusColor: Record<string, string> = {
  UP: '#22c55e',
  DOWN: '#ef4444',
  TIMEOUT: '#f59e0b',
  ERROR: '#f97316',
}

function CustomDot(props: { cx?: number; cy?: number; payload?: CheckLog }) {
  const { cx, cy, payload } = props
  if (!payload || cx === undefined || cy === undefined) return null
  return <circle cx={cx} cy={cy} r={3} fill={statusColor[payload.status] ?? '#6b7280'} />
}

export default function UptimeChart({ logs }: Props) {
  const data = [...logs].reverse().slice(-50).map((l) => ({
    ...l,
    time: formatTime(l.checkedAt),
    responseMs: l.responseTimeMilliseconds ?? 0,
  }))

  if (data.length === 0) {
    return <div className="text-center text-gray-500 py-10">Henüz log yok.</div>
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} unit="ms" />
        <Tooltip
          contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
          labelStyle={{ color: '#9ca3af' }}
          formatter={(val: number, _: string, entry: { payload?: CheckLog }) => [
            `${val}ms`,
            `${entry.payload?.status ?? ''}`,
          ]}
        />
        <Line
          type="monotone"
          dataKey="responseMs"
          stroke="#0ea5e9"
          strokeWidth={2}
          dot={<CustomDot />}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}