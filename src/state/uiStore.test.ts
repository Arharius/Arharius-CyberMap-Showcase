import { describe, expect, it } from 'vitest'
import { createUIStore, type Filter } from './uiStore'

describe('bounded UI controls', () => {
  it('isolates instances and owns only UI controls', () => {
    const a = createUIStore(true)
    const b = createUIStore()
    a.getState().setFilter('RECON')
    a.getState().setPaused(false)
    a.getState().setSelectedId('SYN-005')
    expect(a.getState()).toMatchObject({ presentation: true, paused: false, filter: 'RECON', selectedId: 'SYN-005' })
    expect(b.getState()).toMatchObject({ presentation: false, paused: true, filter: 'ALL' })
    expect(Object.entries(a.getState()).filter(([, value]) => typeof value !== 'function').map(([key]) => key).sort())
      .toEqual(['filter', 'paused', 'presentation', 'scenario', 'seed', 'selectedId'])
  })
  it('bounds seed and selection and rejects unknown filters', () => {
    const store = createUIStore()
    for (const seed of [-1, 1.5, NaN, Infinity, 0x100000000]) store.getState().setSeed(seed)
    expect(store.getState().seed).toBe(42)
    for (const seed of [0, 0xffffffff]) {
      store.getState().setSeed(seed)
      expect(store.getState().seed).toBe(seed)
      expect(store.getState().selectedId).toBeNull()
    }
    store.getState().setSelectedId('x'.repeat(129))
    expect(store.getState().selectedId).toBeNull()
    store.getState().setFilter('unknown' as Filter)
    expect(store.getState().filter).toBe('ALL')
    store.getState().setSelectedId('SYN-001')
    store.getState().setScenario('atlas')
    expect(store.getState().selectedId).toBeNull()
    store.getState().setPresentation(true)
    expect(store.getState().presentation).toBe(true)
  })
})
