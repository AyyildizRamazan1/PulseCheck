import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', firstName: '', lastName: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/login', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Kayıt sırasında hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Activity className="w-8 h-8 text-primary-500" />
          <span className="text-2xl font-bold">PulseCheck</span>
        </div>

        <div className="card">
          <h1 className="text-xl font-semibold mb-6">Kayıt Ol</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Ad</label>
                <input name="firstName" className="input-field" placeholder="Ramazan" value={form.firstName} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Soyad</label>
                <input name="lastName" className="input-field" placeholder="Ayyıldız" value={form.lastName} onChange={handleChange} required />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Kullanıcı Adı</label>
              <input name="username" className="input-field" placeholder="kullaniciadi" value={form.username} onChange={handleChange} required minLength={3} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">E-posta</label>
              <input name="email" type="email" className="input-field" placeholder="ornek@mail.com" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Şifre</label>
              <input name="password" type="password" className="input-field" placeholder="En az 8 karakter" value={form.password} onChange={handleChange} required minLength={8} />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
              <UserPlus className="w-4 h-4" />
              {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Zaten hesabın var mı?{' '}
            <Link to="/login" className="text-primary-500 hover:underline">Giriş Yap</Link>
          </p>
        </div>
      </div>
    </div>
  )
}