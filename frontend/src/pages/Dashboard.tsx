import { useEffect, useState, FormEvent } from 'react'
import { Plus, X, RefreshCw, Server, Pencil, Trash2, Pause, Play } from 'lucide-react'
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
  version?: number
  createdAt?: string
  updatedAt?: string
  lastStatus?: string
  lastResponseMs?: number
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

type MonitorForm = typeof emptyForm

export default function Dashboard() {
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [logs, setLogs] = useState<CheckLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  // Create modal
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<MonitorForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Edit modal
  const [editMonitor, setEditMonitor] = useState<Monitor | null>(null)
  const [editForm, setEditForm] = useState<MonitorForm>(emptyForm)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Inline action error (pause/play)
  const [actionError, setActionError] = useState('')

  const fetchMonitors = async () => {
    try {
      const { data } = await api.get<PageResponse<Monitor>>('/v1/monitors?size=100')
      const list = data.content

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

  useEffect(() => {
    setActionError('')
  }, [selectedId])

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }))
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setEditForm((prev) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }))
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

  const openEdit = (monitor: Monitor) => {
    setEditMonitor(monitor)
    setEditForm({
      name: monitor.name,
      url: monitor.url,
      type: monitor.type,
      checkIntervalSeconds: monitor.checkIntervalSeconds,
      timeoutSeconds: monitor.timeoutSeconds,
      expectedStatusCode: monitor.expectedStatusCode,
      enabled: monitor.enabled,
    })
    setEditError('')
  }

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault()
    if (!editMonitor) return
    setEditError('')
    setEditSaving(true)
    try {
      // Spread full existing monitor so backend receives version, createdAt, etc.
      await api.put(`/v1/monitors/${editMonitor.id}`, { ...editMonitor, ...editForm })
      setEditMonitor(null)
      await fetchMonitors()
    } catch (err: unknown) {
      type ApiErr = { response?: { data?: { message?: string; error?: string } }; message?: string }
      const e = err as ApiErr
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Monitor güncellenemedi.'
      setEditError(msg)
    } finally {
      setEditSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await api.delete(`/v1/monitors/${deleteId}`)
      if (selectedId === deleteId) setSelectedId(null)
      setDeleteId(null)
      await fetchMonitors()
    } catch {
      // ignore, user can retry
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleEnabled = async (monitor: Monitor) => {
    setActionError('')
    try {
      await api.put(`/v1/monitors/${monitor.id}`, { ...monitor, enabled: !monitor.enabled })
      await fetchMonitors()
    } catch (err: unknown) {
      type ApiErr = { response?: { data?: { message?: string; error?: string } }; message?: string }
      const e = err as ApiErr
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Durum güncellenemedi.'
      setActionError(msg)
    }
  }

  const upCount = monitors.filter((m) => m.lastStatus === 'UP').length
  const downCount = monitors.filter(
    (m) => m.lastStatus === 'DOWN' || m.lastStatus === 'ERROR' || m.lastStatus === 'TIMEOUT',
  ).length
  const monitorsWithMs = monitors.filter((m) => m.lastResponseMs != null)
  const avgResponseMs =
    monitorsWithMs.length > 0
      ? Math.round(
          monitorsWithMs.reduce((sum, m) => sum + (m.lastResponseMs ?? 0), 0) /
            monitorsWithMs.length,
        )
      : null

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-400">
              {avgResponseMs != null ? `${avgResponseMs}ms` : '—'}
            </div>
            <div className="text-sm text-gray-400 mt-1">Ortalama Hız</div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Monitor list */}
          <div className="w-80 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">Monitörler</h2>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Canlı
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={fetchMonitors}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-primary flex items-center gap-1 py-1.5 text-sm"
                >
                  <Plus className="w-4 h-4" /> Ekle
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {monitors.length === 0 ? (
                <div className="card flex flex-col items-center justify-center py-12 text-center gap-3">
                  <Server className="w-10 h-10 text-gray-600" />
                  <div>
                    <p className="text-gray-400 font-medium">Henüz monitör yok</p>
                    <p className="text-gray-600 text-sm mt-0.5">Sitelerini izlemeye şimdi başla</p>
                  </div>
                  <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center gap-1.5 text-sm mt-1"
                  >
                    <Plus className="w-4 h-4" /> İlk Monitörünü Ekle
                  </button>
                </div>
              ) : (
                monitors.map((m) => (
                  <MonitorCard
                    key={m.id}
                    monitor={m}
                    isSelected={m.id === selectedId}
                    onClick={() => setSelectedId(m.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Detail panel */}
          <div className="flex-1 min-w-0">
            {selectedMonitor ? (
              <div className="space-y-4">
                <div className="card">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-lg">{selectedMonitor.name}</h3>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium mr-1 ${
                          selectedMonitor.enabled
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        {selectedMonitor.enabled ? 'Aktif' : 'Pasif'}
                      </span>
                      <button
                        onClick={() => openEdit(selectedMonitor)}
                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors rounded-lg"
                        title="Düzenle"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleEnabled(selectedMonitor)}
                        className={`p-1.5 transition-colors rounded-lg ${
                          selectedMonitor.enabled
                            ? 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10'
                            : 'text-gray-400 hover:text-green-400 hover:bg-green-400/10'
                        }`}
                        title={selectedMonitor.enabled ? 'Duraklat' : 'Başlat'}
                      >
                        {selectedMonitor.enabled ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteId(selectedMonitor.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors rounded-lg"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-1">{selectedMonitor.url}</p>
                  {actionError && (
                    <p className="text-xs text-red-400 mb-2">{actionError}</p>
                  )}
                  <div className="grid grid-cols-3 gap-4 text-sm mt-2">
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
                  <h4 className="font-medium mb-4 text-sm text-gray-400 uppercase tracking-wide">
                    Yanıt Süresi (son 50 kontrol)
                  </h4>
                  {logsLoading ? (
                    <div className="text-center text-gray-500 py-10">Yükleniyor...</div>
                  ) : (
                    <UptimeChart logs={logs} />
                  )}
                </div>

                <div className="card">
                  <h4 className="font-medium mb-3 text-sm text-gray-400 uppercase tracking-wide">
                    Son Kontroller
                  </h4>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {logs.slice(0, 20).map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between text-sm py-1.5 border-b border-gray-800 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              log.status === 'UP'
                                ? 'bg-green-400'
                                : log.status === 'DOWN'
                                  ? 'bg-red-400'
                                  : log.status === 'TIMEOUT'
                                    ? 'bg-yellow-400'
                                    : 'bg-orange-400'
                            }`}
                          />
                          <span className="text-gray-400">
                            {new Date(log.checkedAt).toLocaleString('tr-TR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-400">
                          {log.statusCode && <span>HTTP {log.statusCode}</span>}
                          {log.responseTimeMilliseconds != null && (
                            <span>{log.responseTimeMilliseconds}ms</span>
                          )}
                          <span
                            className={`font-medium ${
                              log.status === 'UP'
                                ? 'text-green-400'
                                : log.status === 'DOWN'
                                  ? 'text-red-400'
                                  : log.status === 'TIMEOUT'
                                    ? 'text-yellow-400'
                                    : 'text-orange-400'
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <div className="text-gray-500 text-center py-4">
                        Henüz kontrol yapılmadı.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card flex flex-col items-center justify-center h-64 gap-3 text-center">
                <Server className="w-12 h-12 text-gray-700" />
                <div>
                  <p className="text-gray-400 font-medium">Bir monitör seç</p>
                  <p className="text-gray-600 text-sm mt-0.5">
                    Detayları görmek için sol listeden bir monitöre tıkla
                  </p>
                </div>
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
                <input
                  name="name"
                  className="input-field"
                  placeholder="Google Test"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">URL</label>
                <input
                  name="url"
                  className="input-field"
                  placeholder="https://example.com"
                  value={form.url}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Kontrol Sıklığı (sn)</label>
                  <input
                    name="checkIntervalSeconds"
                    type="number"
                    min={10}
                    className="input-field"
                    value={form.checkIntervalSeconds}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Timeout (sn)</label>
                  <input
                    name="timeoutSeconds"
                    type="number"
                    min={1}
                    max={60}
                    className="input-field"
                    value={form.timeoutSeconds}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Beklenen HTTP Kodu</label>
                <input
                  name="expectedStatusCode"
                  type="number"
                  className="input-field"
                  value={form.expectedStatusCode}
                  onChange={handleFormChange}
                  required
                />
              </div>
              {formError && <p className="text-red-400 text-sm">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  İptal
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Kaydediliyor...' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Monitor Modal */}
      {editMonitor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg">Monitörü Düzenle</h2>
              <button
                onClick={() => setEditMonitor(null)}
                className="text-gray-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">İsim</label>
                <input
                  name="name"
                  className="input-field"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">URL</label>
                <input
                  name="url"
                  className="input-field"
                  value={editForm.url}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Kontrol Sıklığı (sn)</label>
                  <input
                    name="checkIntervalSeconds"
                    type="number"
                    min={10}
                    className="input-field"
                    value={editForm.checkIntervalSeconds}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Timeout (sn)</label>
                  <input
                    name="timeoutSeconds"
                    type="number"
                    min={1}
                    max={60}
                    className="input-field"
                    value={editForm.timeoutSeconds}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Beklenen HTTP Kodu</label>
                <input
                  name="expectedStatusCode"
                  type="number"
                  className="input-field"
                  value={editForm.expectedStatusCode}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              {editError && <p className="text-red-400 text-sm">{editError}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditMonitor(null)}
                  className="btn-secondary flex-1"
                >
                  İptal
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={editSaving}>
                  {editSaving ? 'Kaydediliyor...' : 'Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-sm text-center">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h2 className="font-semibold text-lg mb-1">Monitörü Sil</h2>
            <p className="text-gray-400 text-sm mb-5">
              Bu monitör ve tüm logları kalıcı olarak silinecek. Emin misiniz?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">
                İptal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50"
              >
                {deleting ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}