import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle, BarChart3, Bell, Building2, Calendar, CheckCircle2, Clock,
  ClipboardCheck, ClipboardList, Loader2, PlusSquare, RefreshCw, Send, ShieldCheck,
  TrendingUp, UserCog, Users, X,
} from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { getUsers } from '../api/adminService'
import { getCompanies } from '../api/companyService'
import { CompanyDto } from '../types/company.types'
import { getUnreadNotifications, markAsRead } from '../api/notificationService'
import {
  approveTask, getApprovedForPublishTasks, getMyTasks, getPendingApprovalTasks,
  getTasks, publishTask, rejectTaskByApprover,
} from '../api/taskService'
import { useAuth } from '../context/AuthContext'
import { TaskDto, TaskPriority, TaskStatus } from '../types/task.types'
import {
  getPlatformLabel, getStatusValue, priorityLabels, statusLabels,
} from '../utils/enumHelpers'
import { formatDate, formatDateTime, isOverdue } from '../utils/dateHelpers'
import { getRelevantNotifications } from '../utils/notificationHelpers'
import { formatTaskNumber } from '../utils/taskNumber'
import ErrorMessage from '../components/common/ErrorMessage'
import LoadingSpinner from '../components/common/LoadingSpinner'
import TaskPriorityBadge from '../components/tasks/TaskPriorityBadge'
import TaskStatusBadge from '../components/tasks/TaskStatusBadge'
import { toast } from 'react-toastify'

const STATUS_COLORS = ['#94a3b8', '#f59e0b', '#22c55e', '#ef4444']
const PRIORITY_COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444']
const PLATFORM_COLORS = ['#dc2626', '#ec4899', '#111827', '#ef4444']

const getPriorityValue = (priority: string | number): number => {
  if (typeof priority === 'number') return priority
  const map: Record<string, number> = { low: 0, medium: 1, high: 2, urgent: 3 }
  return map[priority.toLowerCase()] ?? TaskPriority.Medium
}

const isThisWeek = (date?: string) => {
  if (!date) return false
  const value = new Date(date)
  const now = new Date()
  const firstDay = new Date(now)
  firstDay.setDate(now.getDate() - now.getDay())
  firstDay.setHours(0, 0, 0, 0)
  const lastDay = new Date(firstDay)
  lastDay.setDate(firstDay.getDate() + 7)
  return value >= firstDay && value < lastDay
}

const isThisMonth = (date?: string) => {
  if (!date) return false
  const value = new Date(date)
  const now = new Date()
  return value.getMonth() === now.getMonth() && value.getFullYear() === now.getFullYear()
}

const daysBetween = (start?: string, end?: string) => {
  if (!start || !end) return null
  return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000)
}

function roleMeta(role: string) {
  switch (role) {
    case 'Admin':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'Approver & Publisher':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'Approver':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'Publisher':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

type DrilldownState = {
  title: string
  kind: 'tasks'
  items: TaskDto[]
} | {
  title: string
  kind: 'users'
  items: any[]
} | {
  title: string
  kind: 'companies'
  items: CompanyDto[]
} | null

function StatCard({ icon, label, value, sub, tone = 'text-gray-900', onClick }: {
  icon: React.ReactNode
  label: string
  value: number | string
  sub?: string
  tone?: string
  onClick?: () => void
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`mt-1 text-3xl font-bold ${tone}`}>{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className="rounded-xl bg-gray-50 p-3">{icon}</div>
      </div>
    </>
  )

  const className = `rounded-xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all ${
    onClick ? 'cursor-pointer hover:border-red-200 hover:shadow-md' : ''
  }`

  if (onClick) return <button type="button" onClick={onClick} className={className}>{content}</button>
  return <div className={className}>{content}</div>
}

function Section({ title, icon, action, children }: {
  title: string
  icon?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-gray-900">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  )
}

export default function DashboardPage() {
  const { state, hasRole } = useAuth()
  const qc = useQueryClient()
  const [now, setNow] = useState(new Date())
  const [drilldown, setDrilldown] = useState<DrilldownState>(null)

  const isAdmin = state.role === 'Admin'
  const isApprover = hasRole('Approver')
  const isPublisher = hasRole('Publisher')
  const displayRole = isAdmin ? 'Admin' : 'User'

  const myTasksQuery = useQuery({ queryKey: ['my-tasks'], queryFn: getMyTasks })
  const allTasksQuery = useQuery({ queryKey: ['tasks', 'dashboard'], queryFn: () => getTasks({ pageSize: 500 }), enabled: isAdmin })
  const pendingApprovalQuery = useQuery({ queryKey: ['pending-approval-tasks'], queryFn: getPendingApprovalTasks, enabled: isAdmin || isApprover })
  const readyPublishQuery = useQuery({ queryKey: ['approved-publish-tasks'], queryFn: getApprovedForPublishTasks, enabled: isAdmin || isPublisher })
  const notificationsQuery = useQuery({ queryKey: ['notifications', 'unread'], queryFn: getUnreadNotifications })
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: getUsers, enabled: isAdmin })
  const companiesQuery = useQuery({ queryKey: ['companies'], queryFn: getCompanies, enabled: isAdmin })

  const approveMutation = useMutation({
    mutationFn: (taskId: number) => approveTask(taskId, 'Approved from dashboard'),
    onSuccess: () => {
      toast.success('Task approved')
      qc.invalidateQueries({ queryKey: ['pending-approval-tasks'] })
      qc.invalidateQueries({ queryKey: ['approved-publish-tasks'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (taskId: number) => rejectTaskByApprover(taskId, 'Rejected from dashboard'),
    onSuccess: () => {
      toast.success('Task rejected')
      qc.invalidateQueries({ queryKey: ['pending-approval-tasks'] })
    },
  })

  const publishMutation = useMutation({
    mutationFn: (taskId: number) => publishTask(taskId, 'Published from dashboard'),
    onSuccess: () => {
      toast.success('Task published')
      qc.invalidateQueries({ queryKey: ['approved-publish-tasks'] })
    },
  })

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', 'unread'] }),
  })

  const refreshAll = () => {
    setNow(new Date())
    qc.invalidateQueries({ queryKey: ['my-tasks'] })
    qc.invalidateQueries({ queryKey: ['tasks'] })
    qc.invalidateQueries({ queryKey: ['pending-approval-tasks'] })
    qc.invalidateQueries({ queryKey: ['approved-publish-tasks'] })
    qc.invalidateQueries({ queryKey: ['notifications'] })
    qc.invalidateQueries({ queryKey: ['users'] })
    qc.invalidateQueries({ queryKey: ['companies'] })
  }

  const hasError = myTasksQuery.isError || allTasksQuery.isError || pendingApprovalQuery.isError || readyPublishQuery.isError || notificationsQuery.isError || usersQuery.isError || companiesQuery.isError
  const isLoading = myTasksQuery.isLoading || allTasksQuery.isLoading || pendingApprovalQuery.isLoading || readyPublishQuery.isLoading || notificationsQuery.isLoading || usersQuery.isLoading || companiesQuery.isLoading

  const myTasks = useMemo(() => myTasksQuery.data || [], [myTasksQuery.data])
  const allTasks = useMemo(
    () => isAdmin ? allTasksQuery.data || [] : myTasks,
    [allTasksQuery.data, isAdmin, myTasks],
  )
  const pendingApprovals = useMemo(() => pendingApprovalQuery.data || [], [pendingApprovalQuery.data])
  const readyToPublish = useMemo(() => readyPublishQuery.data || [], [readyPublishQuery.data])
  const notifications = useMemo(
    () => getRelevantNotifications(notificationsQuery.data || [], state),
    [notificationsQuery.data, state],
  )

  const completedMyTasks = myTasks.filter(t => getStatusValue(t.status) === TaskStatus.Completed || getStatusValue(t.status) === TaskStatus.Published || getStatusValue(t.status) === TaskStatus.Closed)
  const pendingMyTasks = myTasks.filter(t => getStatusValue(t.status) === TaskStatus.Pending)
  const overdueMyTasks = myTasks.filter(t => isOverdue(t.dueDate, getStatusValue(t.status)))
  const completedSystemTasks = allTasks.filter(t => [TaskStatus.Completed, TaskStatus.Published, TaskStatus.Closed].includes(getStatusValue(t.status)))
  const inProgressSystemTasks = allTasks.filter(t => getStatusValue(t.status) === TaskStatus.InProgress)
  const rejectedSystemTasks = allTasks.filter(t => getStatusValue(t.status) === TaskStatus.Rejected)

  const recentTasks = useMemo(() => {
    const source = isAdmin
      ? allTasks
      : isApprover && isPublisher
        ? [...pendingApprovals, ...readyToPublish]
        : isApprover
          ? pendingApprovals
          : isPublisher
            ? readyToPublish
            : myTasks
    return [...source].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()).slice(0, 5)
  }, [allTasks, isAdmin, isApprover, isPublisher, myTasks, pendingApprovals, readyToPublish])

  const quickLinks = isAdmin ? [
    ['/tasks/create', 'Create New Task', PlusSquare],
    ['/users', 'Manage Users', UserCog],
    ['/tasks', 'View All Tasks', ClipboardList],
  ] : [
    ...(isApprover ? [
      ['/approval/pending', 'View Pending Approvals', ShieldCheck],
      ['/approval/pending', 'Approval Queue', ClipboardCheck],
    ] : []),
    ...(isPublisher ? [
      ['/publish/ready', 'View Ready to Publish', Send],
      ['/publish/ready', 'Publishing Queue', ClipboardCheck],
    ] : []),
    ...(!isApprover && !isPublisher ? [
      ['/tasks/my-tasks', 'My Tasks', ClipboardList],
      ['/notifications', 'View Notifications', Bell],
    ] : []),
  ]

  const recentTasksLink = isAdmin
    ? '/tasks'
    : isApprover && !isPublisher
      ? '/approval/pending'
      : isPublisher && !isApprover
        ? '/publish/ready'
        : '/tasks/my-tasks'

  const upcomingDeadlines = myTasks
    .filter(t => {
      const due = new Date(t.dueDate)
      const diff = (due.getTime() - now.getTime()) / 86_400_000
      const status = getStatusValue(t.status)
      return diff >= -1 && diff <= 7 && status !== TaskStatus.Completed && status !== TaskStatus.Closed && status !== TaskStatus.Published
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5)

  const statusChartData = Object.values(TaskStatus)
    .filter((status): status is TaskStatus => typeof status === 'number')
    .map(status => ({
    name: statusLabels[status],
    value: allTasks.filter(t => getStatusValue(t.status) === status).length,
    tasks: allTasks.filter(t => getStatusValue(t.status) === status),
  })).filter(item => item.value > 0)

  const priorityChartData = Object.entries(priorityLabels).map(([key, name]) => ({
    name,
    value: allTasks.filter(t => getPriorityValue(t.priority) === Number(key)).length,
    tasks: allTasks.filter(t => getPriorityValue(t.priority) === Number(key)),
  }))

  const platformChartData = ['Facebook', 'Instagram', 'TikTok', 'YouTube'].map(name => ({
    name,
    value: allTasks.filter(t => getPlatformLabel(t.platform) === name).length,
    tasks: allTasks.filter(t => getPlatformLabel(t.platform) === name),
  }))

  const weeklyTrendData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now)
    date.setDate(now.getDate() - (6 - index))
    const label = date.toLocaleDateString(undefined, { weekday: 'short' })
    const value = allTasks.filter(t => {
      const updated = new Date(t.updatedAt)
      return updated.toDateString() === date.toDateString() && getStatusValue(t.status) === TaskStatus.Completed
    })
    return { name: label, value: value.length, tasks: value }
  })

  const completionRate = allTasks.length ? Math.round((allTasks.filter(t => getStatusValue(t.status) === TaskStatus.Completed || getStatusValue(t.status) === TaskStatus.Published || getStatusValue(t.status) === TaskStatus.Closed).length / allTasks.length) * 100) : 0
  const completionTimes = allTasks
    .filter(t => getStatusValue(t.status) === TaskStatus.Completed || getStatusValue(t.status) === TaskStatus.Published || getStatusValue(t.status) === TaskStatus.Closed)
    .map(t => daysBetween(t.createdAt, t.updatedAt))
    .filter((value): value is number => value !== null)
  const averageCompletionDays = completionTimes.length ? (completionTimes.reduce((sum, value) => sum + value, 0) / completionTimes.length).toFixed(1) : '0'
  const createdThisMonth = allTasks.filter(t => isThisMonth(t.createdAt)).length
  const completedThisMonth = allTasks.filter(t => isThisMonth(t.updatedAt) && getStatusValue(t.status) === TaskStatus.Completed).length

  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  if (isLoading) return <LoadingSpinner size="lg" className="mt-20" />
  if (hasError) return <ErrorMessage message="Failed to load dashboard data. Please refresh and try again." />

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{greeting}, {state.username || 'there'}</h1>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${roleMeta(displayRole)}`}>{displayRole}</span>
            {!isAdmin && isApprover && (
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${roleMeta('Approver')}`}>Approver</span>
            )}
            {!isAdmin && isPublisher && (
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${roleMeta('Publisher')}`}>Publisher</span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">{formatDateTime(now.toISOString())}</p>
        </div>
        <button onClick={refreshAll} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isAdmin && (
          <>
            <StatCard icon={<ClipboardList className="h-5 w-5 text-red-500" />} label="Total Tasks" value={allTasks.length} onClick={() => setDrilldown({ title: 'All Tasks', kind: 'tasks', items: allTasks })} />
            <StatCard icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} label="Completed / Published" value={completedSystemTasks.length} tone="text-green-600" onClick={() => setDrilldown({ title: 'Completed / Published Tasks', kind: 'tasks', items: completedSystemTasks })} />
            <StatCard icon={<Users className="h-5 w-5 text-purple-500" />} label="Total Users" value={(usersQuery.data || []).length} tone="text-purple-700" onClick={() => setDrilldown({ title: 'Users', kind: 'users', items: usersQuery.data || [] })} />
            <StatCard icon={<Building2 className="h-5 w-5 text-red-500" />} label="Total Companies" value={(companiesQuery.data || []).length} onClick={() => setDrilldown({ title: 'Companies', kind: 'companies', items: companiesQuery.data || [] })} />
            <StatCard icon={<ShieldCheck className="h-5 w-5 text-green-500" />} label="Pending Approval" value={pendingApprovals.length} tone="text-green-600" onClick={() => setDrilldown({ title: 'Pending Approval Tasks', kind: 'tasks', items: pendingApprovals })} />
            <StatCard icon={<Send className="h-5 w-5 text-blue-500" />} label="Ready to Publish" value={readyToPublish.length} tone="text-blue-600" onClick={() => setDrilldown({ title: 'Ready to Publish Tasks', kind: 'tasks', items: readyToPublish })} />
            <StatCard icon={<Clock className="h-5 w-5 text-amber-500" />} label="In Progress" value={inProgressSystemTasks.length} tone="text-amber-600" onClick={() => setDrilldown({ title: 'In Progress Tasks', kind: 'tasks', items: inProgressSystemTasks })} />
            <StatCard icon={<AlertTriangle className="h-5 w-5 text-red-500" />} label="Rejected" value={rejectedSystemTasks.length} tone="text-red-600" onClick={() => setDrilldown({ title: 'Rejected Tasks', kind: 'tasks', items: rejectedSystemTasks })} />
          </>
        )}
        {!isAdmin && (
          <>
            <StatCard icon={<ClipboardList className="h-5 w-5 text-red-500" />} label="My Assigned Tasks" value={myTasks.length} onClick={() => setDrilldown({ title: 'My Assigned Tasks', kind: 'tasks', items: myTasks })} />
            <StatCard icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} label="Completed By Me" value={completedMyTasks.length} tone="text-green-600" onClick={() => setDrilldown({ title: 'Completed By Me', kind: 'tasks', items: completedMyTasks })} />
            <StatCard icon={<Clock className="h-5 w-5 text-amber-500" />} label="Pending Tasks" value={pendingMyTasks.length} tone="text-amber-600" onClick={() => setDrilldown({ title: 'Pending Tasks', kind: 'tasks', items: pendingMyTasks })} />
            <StatCard icon={<AlertTriangle className="h-5 w-5 text-red-500" />} label="Overdue Tasks" value={overdueMyTasks.length} tone={overdueMyTasks.length ? 'text-red-600' : 'text-gray-900'} onClick={() => setDrilldown({ title: 'Overdue Tasks', kind: 'tasks', items: overdueMyTasks })} />
          </>
        )}
        {isApprover && !isAdmin && (
          <>
            <StatCard icon={<ShieldCheck className="h-5 w-5 text-green-500" />} label="Awaiting Approval" value={pendingApprovals.length} tone="text-green-600" onClick={() => setDrilldown({ title: 'Awaiting Approval', kind: 'tasks', items: pendingApprovals })} />
            <StatCard icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} label="Approved This Week" value={myTasks.filter(t => isThisWeek(t.approvedAt)).length} tone="text-green-600" onClick={() => setDrilldown({ title: 'Approved This Week', kind: 'tasks', items: myTasks.filter(t => isThisWeek(t.approvedAt)) })} />
            <StatCard icon={<AlertTriangle className="h-5 w-5 text-red-500" />} label="Rejected This Week" value={myTasks.filter(t => isThisWeek(t.updatedAt) && getStatusValue(t.status) === TaskStatus.Rejected).length} tone="text-red-600" onClick={() => setDrilldown({ title: 'Rejected This Week', kind: 'tasks', items: myTasks.filter(t => isThisWeek(t.updatedAt) && getStatusValue(t.status) === TaskStatus.Rejected) })} />
          </>
        )}
        {isPublisher && !isAdmin && (
          <>
            <StatCard icon={<Send className="h-5 w-5 text-blue-500" />} label="Ready to Publish" value={readyToPublish.length} tone="text-blue-600" onClick={() => setDrilldown({ title: 'Ready to Publish', kind: 'tasks', items: readyToPublish })} />
            <StatCard icon={<CheckCircle2 className="h-5 w-5 text-blue-500" />} label="Published This Week" value={myTasks.filter(t => isThisWeek(t.publishedAt)).length} tone="text-blue-600" onClick={() => setDrilldown({ title: 'Published This Week', kind: 'tasks', items: myTasks.filter(t => isThisWeek(t.publishedAt)) })} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map(([to, label, Icon]: any) => (
          <Link key={label} to={to} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:border-red-200 hover:text-red-600">
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </div>

      {isAdmin && (
        <>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Section title="Tasks by Status" icon={<TrendingUp className="h-4 w-4 text-red-500" />}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    label={({ name, value }) => `${name}: ${value}`}
                    onClick={(data) => setDrilldown({ title: `${data.name} Tasks`, kind: 'tasks', items: data.tasks })}
                  >
                    {statusChartData.map((_, index) => <Cell key={index} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Tasks by Priority" icon={<BarChart3 className="h-4 w-4 text-red-500" />}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={priorityChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {priorityChartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={PRIORITY_COLORS[index]}
                        className="cursor-pointer"
                        onClick={() => setDrilldown({ title: `${entry.name} Priority Tasks`, kind: 'tasks', items: entry.tasks })}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Tasks by Platform" icon={<BarChart3 className="h-4 w-4 text-red-500" />}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={platformChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {platformChartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={PLATFORM_COLORS[index]}
                        className="cursor-pointer"
                        onClick={() => setDrilldown({ title: `${entry.name} Tasks`, kind: 'tasks', items: entry.tasks })}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Section>
            <Section title="Weekly Completion Trend" icon={<TrendingUp className="h-4 w-4 text-red-500" />}>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={weeklyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#dc2626"
                    strokeWidth={3}
                    dot={{ r: 4, cursor: 'pointer' }}
                    activeDot={{
                      r: 6,
                      onClick: (_event, payload: any) => setDrilldown({
                        title: `Completed Tasks on ${payload.payload.name}`,
                        kind: 'tasks',
                        items: payload.payload.tasks,
                      }),
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Section>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard icon={<TrendingUp className="h-5 w-5 text-green-500" />} label="Completion Rate" value={`${completionRate}%`} tone="text-green-600" />
            <StatCard icon={<Clock className="h-5 w-5 text-amber-500" />} label="Avg Completion Time" value={`${averageCompletionDays}d`} tone="text-amber-600" />
            <StatCard icon={<ClipboardCheck className="h-5 w-5 text-red-500" />} label="Created vs Completed This Month" value={`${createdThisMonth}/${completedThisMonth}`} />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section title="Recent Tasks" action={<Link to={recentTasksLink} className="text-sm font-medium text-red-600">View all</Link>}>
          <div className="space-y-2">
            {recentTasks.length === 0 ? <p className="py-6 text-center text-sm text-gray-400">No tasks to show</p> : recentTasks.map(task => (
              <Link key={task.id} to={`/tasks/${task.id}`} className="flex flex-wrap items-center gap-3 rounded-xl p-3 hover:bg-gray-50">
                <span className="text-xs font-semibold text-red-700">{formatTaskNumber(task.id)}</span>
                <span className="min-w-0 flex-1 text-sm font-semibold text-gray-900">{task.title}</span>
                <TaskStatusBadge status={task.status} />
                <TaskPriorityBadge priority={task.priority} />
                <span className="text-xs text-gray-500">{task.dueDate ? formatDate(task.dueDate) : 'No due date'}</span>
                <span className="text-xs text-gray-500">{task.assignedUserName || 'Unassigned'}</span>
              </Link>
            ))}
          </div>
        </Section>

        <Section title="Unread Notifications" icon={<Bell className="h-4 w-4 text-red-500" />} action={<Link to="/notifications" className="text-sm font-medium text-red-600">View all</Link>}>
          <div className="space-y-2">
            {notifications.slice(0, 5).length === 0 ? <p className="py-6 text-center text-sm text-gray-400">No unread notifications</p> : notifications.slice(0, 5).map(notification => (
              <div key={notification.id} className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-red-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{notification.title}</p>
                  <p className="line-clamp-2 text-xs text-gray-500">{notification.message}</p>
                  <p className="mt-1 text-xs text-gray-400">{formatDateTime(notification.createdAt)}</p>
                </div>
                <button onClick={() => markReadMutation.mutate(notification.id)} className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Read</button>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {!isAdmin && !isApprover && !isPublisher && (
        <Section title="Upcoming Deadlines" icon={<Calendar className="h-4 w-4 text-red-500" />}>
          <div className="space-y-2">
            {upcomingDeadlines.length === 0 ? <p className="py-6 text-center text-sm text-gray-400">No upcoming deadlines</p> : upcomingDeadlines.map(task => {
              const days = Math.ceil((new Date(task.dueDate).getTime() - now.getTime()) / 86_400_000)
              const color = days < 0 ? 'text-red-600' : days === 0 ? 'text-orange-600' : 'text-yellow-600'
              return (
                <Link key={task.id} to={`/tasks/${task.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-red-700">{formatTaskNumber(task.id)}</span>
                    <span className="block truncate text-sm font-semibold text-gray-900">{task.title}</span>
                  </span>
                  <span className={`text-xs font-semibold ${color}`}>{days < 0 ? 'Overdue' : days === 0 ? 'Today' : `${days}d left`}</span>
                </Link>
              )
            })}
          </div>
        </Section>
      )}

      {isApprover && (
        <Section title="Approval Queue" icon={<ShieldCheck className="h-4 w-4 text-green-500" />}>
          <div className="space-y-2">
            {pendingApprovals.slice(0, 5).length === 0 ? <p className="py-6 text-center text-sm text-gray-400">No tasks waiting for approval</p> : pendingApprovals.slice(0, 5).map(task => (
              <div key={task.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-gray-50 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-red-700">{formatTaskNumber(task.id)}</p>
                  <p className="truncate text-sm font-semibold text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-500">Completed by {task.assignedUserName || 'Unknown'}</p>
                </div>
                <button onClick={() => approveMutation.mutate(task.id)} disabled={approveMutation.isPending} className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">Approve</button>
                <button onClick={() => rejectMutation.mutate(task.id)} disabled={rejectMutation.isPending} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">Reject</button>
              </div>
            ))}
          </div>
        </Section>
      )}

      {isPublisher && (
        <Section title="Publishing Queue" icon={<Send className="h-4 w-4 text-blue-500" />}>
          <div className="space-y-2">
            {readyToPublish.slice(0, 5).length === 0 ? <p className="py-6 text-center text-sm text-gray-400">No tasks ready to publish</p> : readyToPublish.slice(0, 5).map(task => (
              <div key={task.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-gray-50 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-red-700">{formatTaskNumber(task.id)}</p>
                  <p className="truncate text-sm font-semibold text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-500">Approved by {task.approvedByUserName || 'Unknown'}</p>
                </div>
                <button onClick={() => publishMutation.mutate(task.id)} disabled={publishMutation.isPending} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
                  {publishMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Publish
                </button>
              </div>
            ))}
          </div>
        </Section>
      )}

      {drilldown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="font-semibold text-gray-900">{drilldown.title}</h2>
                <p className="text-sm text-gray-500">{drilldown.items.length} item(s)</p>
              </div>
              <button
                onClick={() => setDrilldown(null)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close drilldown"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-4">
              {drilldown.items.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">No items to show.</p>
              ) : drilldown.kind === 'tasks' ? (
                <div className="space-y-2">
                  {drilldown.items.map(task => (
                    <div
                      key={task.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-red-700">{formatTaskNumber(task.id)}</p>
                        <p className="truncate text-sm font-semibold text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500">{task.companyName || 'No company'} - {task.assignedUserName || 'Unassigned'}</p>
                      </div>
                      <TaskStatusBadge status={task.status} />
                      <TaskPriorityBadge priority={task.priority} />
                      <span className="text-xs text-gray-500">{task.dueDate ? formatDate(task.dueDate) : 'No due date'}</span>
                    </div>
                  ))}
                </div>
              ) : drilldown.kind === 'users' ? (
                <div className="space-y-2">
                  {drilldown.items.map(user => (
                    <div key={user.id} className="grid grid-cols-1 gap-1 rounded-xl border border-gray-100 p-3 sm:grid-cols-3">
                      <p className="text-sm font-semibold text-gray-900">{user.username || 'Unnamed user'}</p>
                      <p className="text-sm text-gray-600">{user.email || 'No email'}</p>
                      <p className="text-sm text-gray-500">{user.role || 'No role'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {drilldown.items.map(company => (
                    <div key={company.id} className="rounded-xl border border-gray-100 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">{company.name}</p>
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">{company.taskCount ?? 0} tasks</span>
                      </div>
                      {company.description && <p className="mt-1 text-sm text-gray-500">{company.description}</p>}
                      {company.createdAt && <p className="mt-2 text-xs text-gray-400">Created {formatDate(company.createdAt)}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
