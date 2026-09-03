import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface Props {
  onSubmit: (text: string) => Promise<void>
  submitting: boolean
}

export default function CommentForm({ onSubmit, submitting }: Props) {
  const [text, setText] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    await onSubmit(text.trim())
    setText('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={2}
        placeholder="Add a comment..."
        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        onKeyDown={e => {
          if (e.key === 'Enter' && e.ctrlKey) handleSubmit(e as unknown as React.FormEvent)
        }}
      />
      <button
        type="submit"
        disabled={!text.trim() || submitting}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Post
      </button>
    </form>
  )
}
