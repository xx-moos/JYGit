import { create } from 'zustand'
import type { Repository } from '../../../shared/types'

interface RepositoryState {
  repositories: Repository[]
  loading: boolean
  error: string | null
  
  // Actions
  loadRepositories: () => Promise<void>
  addRepository: (path: string) => Promise<void>
  removeRepository: (path: string) => Promise<void>
  updateRepository: (path: string, updates: Partial<Repository>) => void
  clearError: () => void
}

export const useRepositoryStore = create<RepositoryState>((set, get) => ({
  repositories: [],
  loading: false,
  error: null,

  loadRepositories: async () => {
    set({ loading: true, error: null })
    try {
      const repos = await window.api.repository.getAll()
      set({ repositories: repos, loading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '加载仓库列表失败',
        loading: false 
      })
    }
  },

  addRepository: async (path: string) => {
    set({ loading: true, error: null })
    try {
      await window.api.repository.add(path)
      await get().loadRepositories()
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '添加仓库失败',
        loading: false 
      })
      throw error
    }
  },

  removeRepository: async (path: string) => {
    set({ loading: true, error: null })
    try {
      await window.api.repository.remove(path)
      set(state => ({
        repositories: state.repositories.filter(repo => repo.path !== path),
        loading: false
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '移除仓库失败',
        loading: false 
      })
      throw error
    }
  },

  updateRepository: (path: string, updates: Partial<Repository>) => {
    set(state => ({
      repositories: state.repositories.map(repo =>
        repo.path === path ? { ...repo, ...updates } : repo
      )
    }))
  },

  clearError: () => set({ error: null })
}))