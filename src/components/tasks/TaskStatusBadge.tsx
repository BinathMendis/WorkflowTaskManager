// components/tasks/TaskStatusBadge.tsx
import { getStatusColor, getStatusLabel } from '../../utils/enumHelpers'

interface Props {
  status: string | number
}

export default function TaskStatusBadge({ status }: Props) {
  const label = getStatusLabel(status)
  const colorClass = getStatusColor(status)
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  )
}
