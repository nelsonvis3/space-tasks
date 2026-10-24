/** Orbit's frontend-only, persistent XP system.
 * A task ID can grant XP once, even if the task is reopened or deleted.
 */
export type Priority = 'High' | 'Medium' | 'Low'

export type PlayerProgress = {
  totalXp: number
  rewardedTaskIds: string[]
}

export const XP_BY_PRIORITY: Record<Priority, number> = {
  High: 50,
  Medium: 35,
  Low: 20,
}

export function xpRequiredForLevel(level: number): number {
  return 100 + (level - 1) * 50
}

export function getLevelInfo(totalXp: number) {
  let level = 1
  let xpInLevel = Math.max(0, totalXp)
  // Upper bound protects the browser if corrupted storage contains a huge number.
  while (level < 10000 && xpInLevel >= xpRequiredForLevel(level)) {
    xpInLevel -= xpRequiredForLevel(level)
    level += 1
  }
  const xpToNext = xpRequiredForLevel(level)
  return { level, xpInLevel, xpToNext, percent: Math.min(100, Math.round((xpInLevel / xpToNext) * 100)) }
}

export function grantTaskXp(progress: PlayerProgress, taskId: string, priority: Priority): PlayerProgress {
  if (progress.rewardedTaskIds.includes(taskId)) return progress
  return {
    totalXp: progress.totalXp + XP_BY_PRIORITY[priority],
    rewardedTaskIds: [...progress.rewardedTaskIds, taskId],
  }
}
