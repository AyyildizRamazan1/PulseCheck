import { useEffect, useState, FormEvent } from 'react'
import { Plus, X, RefreshCw } from 'lucide-react'
import Navbar from '../components/Navbar'
import MonitorCard from '../components/MonitorCard'
import UptimeChart from '../components/UptimeChart'
import api from '../services/api'

export interface Monitor {
  id: string
  name: string
  description?: string
  url: string
  type: string
  checkIntervalSeconds: number
  timeoutSeconds: number
  expectedStatusCode: number
  enabled: boolean
  lastStatus?: string
  lastResponseMs?: number
  createdAt: string
}

export interface CheckLog {
  id: string
  monitorId: string
  status: 'UP' | 'DOWN' | 'TIMEOUT' | 'ERROR'
  responseTimeMilliseconds?: number
  statusCode?: number
  errorMessage?: string
  checkedAt: string
}

interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

const emptyForm = {
  name: '',
  url: '',
  type: 'HTTP',
  checkIntervalSeconds: 60,
  timeoutSeconds: 10,
  expectedStatusCode: 200,
  enabled: true,
}

export default function Dashboard() {
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [logs, setLogs] = useState<CheckLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchMonitors = async () => {
    try {
      const { data } = await api.get<PageResponse<Monitor>>('/v1/monitors?size=100')
      const list = data.content

      // Enrich with last status from logs in parallel
      const enriched = await Promise.all(
        list.map(async (m) => {
          try {
            const { data: logData } = await api.get<PageResponse<CheckLog>>(
              `/v1/monitors/${m.id}/logs?size=1`,
            )
            const latest = logData.content[0]
            return {
              ...m,
              lastStatus: latest?.status,
              lastResponseMs: latest?.responseTimeMilliseconds,
            }
          } catch {
            return m
          }
        }),
      )
      setMonitors(enriched)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchMonitors()
    const id = setInterval(fetchMonitors, 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLogsLoading(true)
    api
      .get<PageResponse<CheckLog>>(`/v1/monitors/${selectedId}/logs?size=50`)
      .then(({ data }) => setLogs(data.content))
      .catch(() => setLogs([]))
      .finally(() => setLogsLoading(false))
  }, [selectedId])

  const selectedMonitor = monitors.find((m) => m.id === selectedId) ?? null

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }))
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      await api.post('/v1/monitors', form)
      setShowModal(false)
      setForm(emptyForm)
      await fetchMonitors()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setFormError(msg || 'Monitor oluşturulamadı.')
    } finally {
      setSaving(false)
    }
  }

  const upCount = monitors.filter((m) => m.lastStatus === 'UP').length
  const downCount = monitors.filter((m) => m.lastStatus === 'DOWN' || m.lastStatus === 'ERROR' || m.lastStatus === 'TIMEOUT').length

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card text-center">
            <div className="text-3xl font-bold">{monitors.length}</div>
            <div className="text-sm text-gray-400 mt-1">Toplam Monitor</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-400">{upCount}</div>
            <div className="text-sm text-gray-400 mt-1">Aktif (UP)</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-red-400">{downCount}</div>
            <div className="text-sm text-gray-400 mt-1">Sorunlu</div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Monitor list */}
          <div className="w-80 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Monitörler</h2>
              <div className="flex gap-2">
                <button onClick={fetchMonitors} className="p-1.5 text-gray-400 hover:text-white transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1 py-1.5 text-sm">
                  <Plus className="w-4 h-4" /> Ekle
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {monitors.length === 0 && (
                <div className="text-center text-gray-500 py-10 card">
                  Henüz monitör yok.<br />
                  <button onClick={() => setShowModal(true)} className="text-primary-500 hover:underline text-sm mt-2">İlk monitörü ekle</button>
                </div>
              )}
              {monitors.map((m) => (
                <MonitorCard
                  key={m.id}
                  monitor={m}
                  isSelected={m.id === selectedId}
                  onClick={() => setSelectedId(m.id)}
                />
              ))}
            </div>
          </div>

          {/* Detail panel */}
          <div className="flex-1 min-w-0">
            {selectedMonitor ? (
              <div className="space-y-4">
                <div className="card">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-lg">{selectedMonitor.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      selectedMonitor.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {selectedMonitor.enabled ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{selectedMonitor.url}</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Kontrol Sıklığı</span>
                      <div className="font-medium">{selectedMonitor.checkIntervalSeconds}s</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Timeout</span>
                      <div className="font-medium">{selectedMonitor.timeoutSeconds}s</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Beklenen Kod</span>
                      <div className="font-medium">{selectedMonitor.expectedStatusCode}</div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h4 className="font-medium mb-4 text-sm text-gray-400 uppercase tracking-wide">Yanıt Süresi (son 50 kontrol)</h4>
                  {logsLoading ? (
                    <div className="text-center text-gray-500 py-10">Yükleniyor...</div>
                  ) : (
                    <UptimeChart logs={logs} />
                  )}
                </div>

                <div className="card">
                  <h4 className="font-medium mb-3 text-sm text-gray-400 uppercase tracking-wide">Son Kontroller</h4>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {logs.slice(0, 20).map((log) => (
                      <div key={log.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-800 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            log.status === 'UP' ? 'bg-green-400' :
                            log.status === 'DOWN' ? 'bg-red-400' :
                            log.status === 'TIMEOUT' ? 'bg-yellow-400' : 'bg-orange-400'
                          }`} />
                          <span className="text-gray-400">{new Date(log.checkedAt).toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-400">
                          {log.statusCode && <span>HTTP {log.statusCode}</span>}
                          {log.responseTimeMilliseconds != null && <span>{log.responseTimeMilliseconds}ms</span>}
                          <span className={`font-medium ${
                            log.status === 'UP' ? 'text-green-400' :
                            log.status === 'DOWN' ? 'text-red-400' :
                            log.status === 'TIMEOUT' ? 'text-yellow-400' : 'text-orange-400'
                          }`}>{log.status}</span>
                        </div>
                      </div>
                    ))}
                    {logs.length === 0 && <div className="text-gray-500 text-center py-4">Henüz kontrol yapılmadı.</div>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card flex items-center justify-center h-64 text-gray-500">
                Detay görmek için soldaki listeden bir monitör seç.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Monitor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg">Yeni Monitör Ekle</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">İsim</label>
                <input name="name" className="input-field" placeholder="Google Test" value={form.name} onChange={handleFormChange} required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">URL</label>
                <input name="url" className="input-field" placeholder="https://example.com" value={form.url} onChange={handleFormChange} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Kontrol Sıklığı (sn)</label>
                  <input name="checkIntervalSeconds" type="number" min={10} className="input-field" value={form.checkIntervalSeconds} onChange={handleFormChange} required />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Timeout (sn)</label>
                  <input name="timeoutSeconds" type="number" min={1} max={60} className="input-field" value={form.timeoutSeconds} onChange={handleFormChange} required />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Beklenen HTTP Kodu</label>
                <input name="expectedStatusCode" type="number" className="input-field" value={form.expectedStatusCode} onChange={handleFormChange} required />
              </div>

              {formError && <p className="text-red-400 text-sm">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">İptal</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Kaydediliyor...' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}