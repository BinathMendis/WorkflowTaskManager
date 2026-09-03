import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, CheckSquare, Building2, Bell, ListTodo, PlusSquare, ClipboardList, Users,
  ShieldCheck, Send, CalendarDays, FileText, Search
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const baseLink = 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150'
const activeClass = `${baseLink} bg-red-600 text-white shadow-md shadow-red-600/20`
const inactiveClass = `${baseLink} text-slate-400 hover:text-white hover:bg-white/10`

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
  adminOnly?: boolean
  userOnly?: boolean
  approverOnly?: boolean  // NEW
  publisherOnly?: boolean  // NEW
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard className="h-4.5 w-4.5" />, label: 'Dashboard' },
  { to: '/tasks/search', icon: <Search className="h-4.5 w-4.5" />, label: 'Search Task', adminOnly: true },
  { to: '/tasks', icon: <ClipboardList className="h-4.5 w-4.5" />, label: 'All Tasks', adminOnly: true },
  { to: '/reports/tasks', icon: <FileText className="h-4.5 w-4.5" />, label: 'Task Reports', adminOnly: true },
  { to: '/tasks/my-tasks', icon: <ListTodo className="h-4.5 w-4.5" />, label: 'My Tasks', userOnly: true },
  { to: '/tasks/create', icon: <PlusSquare className="h-4.5 w-4.5" />, label: 'Create Task', adminOnly: true },
  { to: '/companies', icon: <Building2 className="h-4.5 w-4.5" />, label: 'Companies', adminOnly: true },
  { to: '/users', icon: <Users className="h-4.5 w-4.5" />, label: 'Users', adminOnly: true },
  { to: '/approval/pending', icon: <ShieldCheck className="h-4.5 w-4.5" />, label: 'Pending Approvals', approverOnly: true },
  { to: '/publish/ready', icon: <Send className="h-4.5 w-4.5" />, label: 'Ready to Publish', publisherOnly: true },
  { to: '/calendar', icon: <CalendarDays className="h-4.5 w-4.5" />, label: 'Calendar' },
  { to: '/notifications', icon: <Bell className="h-4.5 w-4.5" />, label: 'Notifications' },
]

export default function Sidebar() {
  const { state, hasRole } = useAuth()
  const isPrimaryAdmin = state.role === 'Admin'
  const hasApproverRole = hasRole('Approver')
  const hasPublisherRole = hasRole('Publisher')
  const canApprove = isPrimaryAdmin || hasApproverRole
  const canPublish = isPrimaryAdmin || hasPublisherRole

  const visibleItems = navItems.filter(item => {
    // Admin only items
    if (item.adminOnly && !isPrimaryAdmin) return false
    // User only items
    if (item.userOnly && isPrimaryAdmin) return false
    // Approver only items
    if (item.approverOnly && !canApprove) return false
    // Publisher only items
    if (item.publisherOnly && !canPublish) return false
    return true
  })

  return (
    <aside className="flex flex-col h-full bg-black w-64 flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0">
            <CheckSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">Task Management System</p>
            <p className="text-xs text-slate-500">by Dio Global Solutions</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-xs font-semibold text-red-400">
              {state.username?.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{state.username}</p>
            <p className="text-xs text-slate-500 truncate">{state.role}</p>
            {/* Show additional roles badges */}
            <div className="flex gap-1 mt-1">
              {hasApproverRole && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
                  Approver
                </span>
              )}
              {hasPublisherRole && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                  Publisher
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) => isActive ? activeClass : inactiveClass}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs text-slate-600">v1.0.0</p>
      </div>
    </aside>
  )
}
