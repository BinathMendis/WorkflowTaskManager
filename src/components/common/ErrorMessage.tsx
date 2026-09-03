import { AlertCircle } from 'lucide-react'

interface Props {
  message: string
  className?: string
}

export default function ErrorMessage({ message, className = '' }: Props) {
  return (
    <div className={`flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm ${className}`}>
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
