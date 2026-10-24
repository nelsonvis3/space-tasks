import test from 'node:test'
import assert from 'node:assert/strict'
import { getLevelInfo, grantTaskXp, XP_BY_PRIORITY } from '../src/gamification.ts'

test('initial player starts at level 1', () => {
  assert.deepEqual(getLevelInfo(0), { level: 1, xpInLevel: 0, xpToNext: 100, percent: 0 })
})

test('task rewards scale with priority', () => {
  assert.deepEqual(XP_BY_PRIORITY, { High: 50, Medium: 35, Low: 20 })
})

test('level up after crossing 100 XP', () => {
  const player = grantTaskXp({ totalXp: 55, rewardedTaskIds: ['s4', 's5'] }, 's2', 'High')
  assert.equal(player.totalXp, 105)
  assert.deepEqual(getLevelInfo(player.totalXp), { level: 2, xpInLevel: 5, xpToNext: 150, percent: 3 })
})

test('checking the same task twice never farms XP', () => {
  const player = { totalXp: 0, rewardedTaskIds: [] }
  const first = grantTaskXp(player, 'task-1', 'High')
  assert.strictEqual(grantTaskXp(first, 'task-1', 'High'), first)
  assert.equal(first.totalXp, 50)
})

test('XP keeps leveling across multiple thresholds', () => {
  assert.deepEqual(getLevelInfo(250), { level: 3, xpInLevel: 0, xpToNext: 200, percent: 0 })
})
