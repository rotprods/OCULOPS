import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useKnowledgeStore = create(
  persist(
    (set) => ({
      search: '',
      typeFilter: 'all', // 'all' | 'learning' | 'playbook' | 'template' | 'research' | 'case_study'
      view: 'list', // 'list' | 'grid'
      expandedId: null,

      setSearch: (search) => set({ search }),
      setTypeFilter: (typeFilter) => set({ typeFilter }),
      setView: (view) => set({ view }),
      setExpanded: (expandedId) => set({ expandedId }),
    }),
    { name: 'ag-knowledge-ui', version: 1 }
  )
)
