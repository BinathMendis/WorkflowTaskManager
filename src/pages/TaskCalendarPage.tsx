import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format,
  isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths,
} from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, Building2, Clock, User, X } from 'lucide-react'
import { getCompanies } from '../api/companyService'
import { getMyTasks, getTasks } from '../api/taskService'
import { useAuth } from '../context/AuthContext'
import { TaskDto } from '../types/task.types'
import LoadingSpinner from '../components/common/LoadingSpinner'
import TaskStatusBadge from '../components/tasks/TaskStatusBadge'
import TaskPriorityBadge from '../components/tasks/TaskPriorityBadge'
import { formatDateTime } from '../utils/dateHelpers'
import { getPlatformLabel } from '../utils/enumHelpers'
import { formatTaskNumber } from '../utils/taskNumber'
import SelectField from '../components/common/SelectField'

export default function TaskCalendarPage() {
  const { state } = useAuth()
  const isAdmin = state.role === 'Admin'
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
  const [companyId, setCompanyId] = useState<number | 'all'>('all')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskDto | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', 'calendar'],
    queryFn: getCompanies,
    retry: false,
  })

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['calendar-tasks', isAdmin, companyId, monthStart.toISOString(), monthEnd.toISOString()],
    queryFn: () => isAdmin
      ? getTasks({
          companyId: companyId === 'all' ? undefined : companyId,
          dueDateFrom: monthStart.toISOString(),
          dueDateTo: monthEnd.toISOString(),
          pageSize: 500,
          sortBy: 'duedate',
          sortDescending: false,
        })
      : getMyTasks(),
  })

  const visibleTasks = useMemo(() => {
    return tasks.filter(task => {
      const dueDate = new Date(task.dueDate)
      const inMonth = dueDate >= monthStart && dueDate <= monthEnd
      const matchesCompany = companyId === 'all' || task.companyId === companyId
      return inMonth && matchesCompany
    })
  }, [companyId, monthEnd, monthStart, tasks])

  const companyOptions = useMemo(() => {
    const fromTasks = tasks
      .filter(task => {
        const dueDate = new Date(task.dueDate)
        return dueDate >= monthStart && dueDate <= monthEnd
      })
      .map(task => ({
        id: task.companyId,
        name: task.companyName,
      }))
    const merged = [...companies, ...fromTasks]
    return Array.from(new Map(merged.filter(company => company.id).map(company => [company.id, company])).values())
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [companies, monthEnd, monthStart, tasks])

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const today = new Date()

  const tasksForDay = (day: Date): TaskDto[] =>
    visibleTasks
      .filter(task => isSameDay(new Date(task.dueDate), day))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  if (isLoading) return <LoadingSpinner size="lg" className="mt-12" />

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <CalendarDays className="h-6 w-6 text-red-500" />
            Task Calendar
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">{visibleTasks.length} due tasks in {format(currentMonth, 'MMMM yyyy')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
            <Building2 className="h-4 w-4 text-gray-400" />
            <SelectField
              value={String(companyId)}
              options={[
                { value: 'all', label: 'All companies' },
                ...companyOptions.map(company => ({ value: String(company.id), label: company.name })),
              ]}
              onChange={value => setCompanyId(value === 'all' ? 'all' : Number(value))}
              buttonClassName="h-7 min-w-44 rounded-lg border-0 px-0 py-0 shadow-none hover:bg-white focus:ring-0"
            />
          </div>

          <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              title="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(startOfMonth(new Date()))}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              title="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-7">
          {days.map(day => {
            const dayTasks = tasksForDay(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isToday = isSameDay(day, today)
            const isSelected = selectedDay && isSameDay(day, selectedDay)

            return (
              <div
                role="button"
                tabIndex={0}
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedDay(day)
                  }
                }}
                className={`min-h-[150px] border-b border-gray-100 p-3 text-left transition-colors sm:border-r ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50/70'
                } ${isSelected ? 'ring-2 ring-inset ring-red-500' : 'hover:bg-red-50/30'} cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                    isToday ? 'bg-red-600 text-white' : isCurrentMonth ? 'text-gray-800' : 'text-gray-400'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {dayTasks.slice(0, 3).map(task => (
                    <button
                      type="button"
                      key={task.id}
                      onClick={event => {
                        event.stopPropagation()
                        setSelectedTask(task)
                      }}
                      className="block w-full rounded-lg border border-gray-100 bg-gray-50 p-2 text-left transition-colors hover:border-red-200 hover:bg-red-50/50"
                    >
                      <p className="truncate text-xs font-semibold text-red-700">{formatTaskNumber(task.id)}</p>
                      <p className="truncate text-sm font-semibold text-gray-900">{task.title}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">{task.companyName || 'No company'}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <TaskStatusBadge status={task.status} />
                        <TaskPriorityBadge priority={task.priority} />
                      </div>
                    </button>
                  ))}
                  {dayTasks.length > 3 && (
                    <p className="text-xs font-medium text-gray-500">+{dayTasks.length - 3} more</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedDay(null)} />
          <div className="relative max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="font-semibold text-gray-900">{format(selectedDay, 'EEEE, MMMM d, yyyy')}</h2>
                <p className="text-sm text-gray-500">{tasksForDay(selectedDay).length} due tasks</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-5">
              {tasksForDay(selectedDay).length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">No tasks due on this day</p>
              ) : (
                <div className="space-y-3">
                  {tasksForDay(selectedDay).map(task => (
                    <button
                      type="button"
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="w-full rounded-lg border border-gray-100 bg-gray-50 p-4 text-left transition-colors hover:border-red-200 hover:bg-red-50/50"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold text-red-700">{formatTaskNumber(task.id)}</p>
                          <p className="font-semibold text-gray-900">{task.title}</p>
                          <p className="mt-1 text-sm text-gray-500">{task.companyName || 'No company'}</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <TaskStatusBadge status={task.status} />
                          <TaskPriorityBadge priority={task.priority} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedTask(null)} />
          <div className="relative w-full max-w-xl rounded-xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-red-700">{formatTaskNumber(selectedTask.id)}</p>
                <h2 className="text-lg font-semibold text-gray-900">{selectedTask.title}</h2>
                <p className="mt-1 text-sm text-gray-500">{selectedTask.companyName || 'No company'}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex flex-wrap gap-2">
                <TaskStatusBadge status={selectedTask.status} />
                <TaskPriorityBadge priority={selectedTask.priority} />
              </div>

              {selectedTask.description && (
                <p className="rounded-lg bg-gray-50 p-3 text-sm leading-6 text-gray-700">{selectedTask.description}</p>
              )}

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4 text-gray-400" />
                  Due {formatDateTime(selectedTask.dueDate)}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  {selectedTask.companyName || 'No company'}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4 text-gray-400" />
                  {selectedTask.assignedUserName || 'Unassigned'}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                  {getPlatformLabel(selectedTask.platform)}
                </div>
              </div>

              {(selectedTask.approvedByUserName || selectedTask.publishedByUserName) && (
                <div className="rounded-lg border border-gray-100 p-3 text-sm text-gray-600">
                  {selectedTask.approvedByUserName && <p>Approved by {selectedTask.approvedByUserName}</p>}
                  {selectedTask.publishedByUserName && <p>Published by {selectedTask.publishedByUserName}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
