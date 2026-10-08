import { createStore } from 'zustand/vanilla'
import type { EventKind } from '../events/schema'

export const FILTERS = ['ALL', 'DDOS', 'RECON', 'EXPLOIT'] as const
export type Filter = typeof FILTERS[number]
export const filterKind: Record<Exclude<Filter, 'ALL'>, EventKind> = {
  DDOS: 'DDOS', RECON: 'SCAN', EXPLOIT: 'EXPLOIT_ATTEMPT',
}
export type Scenario = 'atlas'
export interface UIState {
  filter: Filter
  selectedId: string | null
  paused: boolean
  presentation: boolean
  scenario: Scenario
  seed: number
  setFilter: (filter: Filter) => void
  setSelectedId: (id: string | null) => void
  setPaused: (paused: boolean) => void
  setPresentation: (presentation: boolean) => void
  setScenario: (scenario: Scenario) => void
  setSeed: (seed: number) => void
}

/** UI controls only: no event buffers, map instances, timers or persisted data. */
export const createUIStore = (presentation = false) => createStore<UIState>()(set => ({
  filter: 'ALL', selectedId: 'SYN-006', paused: true, presentation, scenario: 'atlas', seed: 42,
  setFilter: filter => { if (FILTERS.includes(filter)) set({ filter, selectedId: null }) },
  setSelectedId: selectedId => {
    if (selectedId === null || /^[A-Za-z0-9_-]{1,128}$/.test(selectedId)) set({ selectedId })
  },
  setPaused: paused => set({ paused }),
  setPresentation: presentation => set({ presentation }),
  setScenario: scenario => { if (scenario === 'atlas') set({ scenario, selectedId: null }) },
  setSeed: seed => {
    if (Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff) set({ seed, selectedId: null })
  },
}))
