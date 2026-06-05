import { Activity, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-500" />
          <span className="font-bold text-lg">PulseCheck</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{user?.username}</span>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
            Çıkış
          </button>
        </div>
      </div>
    </header>
  )
}