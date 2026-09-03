import { useQuery } from '@tanstack/react-query'
import { Clock, CheckCircle, XCircle, Send } from 'lucide-react'
import { formatDateTime } from '../../utils/dateHelpers'

interface ApprovalHistoryItem {
  id: number
  action: string
  userName: string
  comment?: string
  createdAt: string
}

interface Props {
  taskId: number
}

// This would need a backend endpoint: GET /Approval/history/{taskId}
// For now, this is a placeholder component

export default function ApprovalHistory({ taskId }: Props) {
  // Placeholder - you'll need to add this endpoint to your backend
  const { data: history = [] } = useQuery({
    queryKey: ['approval-history', taskId],
    queryFn: async () => {
      // const res = await api.get(`/Approval/history/${taskId}`)
      // return res.data
      return [] as ApprovalHistoryItem[]
    },
    enabled: false, // Disabled until backend endpoint is added
  })

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'approve':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'reject':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'publish':
        return <Send className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  if (history.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Approval History</h3>
      <div className="space-y-3">
        {history.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <div className="mt-0.5">{getActionIcon(item.action)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-gray-900">{item.userName}</span>
                <span className="text-xs text-gray-400">{formatDateTime(item.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-600">
                {item.action} task
                {item.comment && <span className="text-gray-400">: {item.comment}</span>}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}