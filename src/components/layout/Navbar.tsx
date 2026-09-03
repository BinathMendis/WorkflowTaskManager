import { useEffect, useState } from 'react'
import { LogOut, Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../notifications/NotificationBell'
import { useNavigate } from 'react-router-dom'

interface Props {
  onMenuClick?: () => void
  title?: string
}

export default function Navbar({ onMenuClick, title }: Props) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-black border-b border-white/10 px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button onClick={onMenuClick} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
        )}
        {title && <h1 className="text-white font-semibold text-base">{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:block text-right mr-2">
          <p className="text-xs font-medium text-white">
            {now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <p className="text-[11px] text-slate-500">
            {now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <NotificationBell />
        <div className="h-5 w-px bg-white/20" />
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-sm"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
