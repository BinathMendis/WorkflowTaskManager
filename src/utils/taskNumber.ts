export const formatTaskNumber = (taskId: number | string | null | undefined): string => {
  const numericId = Number(taskId)

  if (!Number.isFinite(numericId) || numericId < 0) {
    return 'T000000'
  }

  return `T${Math.trunc(numericId).toString().padStart(6, '0')}`
}

export const parseTaskNumber = (value: string): number | null => {
  const normalized = value.trim().toUpperCase()
  const match = normalized.match(/^T?0*(\d+)$/)

  if (!match) return null

  const taskId = Number(match[1])
  return Number.isFinite(taskId) && taskId > 0 ? taskId : null
}
