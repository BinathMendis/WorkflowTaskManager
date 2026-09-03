// components/tasks/TaskPriorityBadge.tsx
import { TaskPriority } from '../../types/task.types'
import { priorityLabels, priorityColors } from '../../utils/enumHelpers'

interface Props {
  priority: TaskPriority | string | number
}

// Helper to convert string priority to number
const getPriorityValue = (priority: string | number): number => {
  if (typeof priority === 'number') return priority
  
  const priorityMap: Record<string, number> = {
    'Low': 0,
    'Medium': 1,
    'High': 2,
    'Urgent': 3
  }
  
  return priorityMap[priority] ?? 1
}

export default function TaskPriorityBadge({ priority }: Props) {
  const priorityValue = getPriorityValue(priority)
  const label = priorityLabels[priorityValue as TaskPriority] || priority
  const colorClass = priorityColors[priorityValue as TaskPriority] || 'bg-gray-100 text-gray-600'
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  )
}