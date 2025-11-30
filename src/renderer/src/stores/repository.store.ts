import { create } from 'zustand'
import type { Repository } from '../../../shared/types'

interface RepositoryState {
  repositories: Repository[]
  currentRepository: Repository | null
  isLoading: boolean
  error: string | null

  // Actions
  loadRepositories: () => Promise<void>
  setCurrentRepository: (repo: Repository | null) => void
  addRepository: (path: string) => Promise<void>
  removeRepository: (path: string) => Promise<void>
  toggleFavorite: (path: string) => Promise<void>
  updateRepository: (path: string, data: Partial<Repository>) => Promise<void>
}

/**
 * 仓库状态管理
 * 使用 zustand 管理仓库列表和当前仓库
 */
export const useRepositoryStore = create<RepositoryState>((set, get) => ({
  repositories: [],
  currentRepository: null,
  isLoading: false,
  error: null,

  // 加载所有仓库
  loadRepositories: async () => {
    set({ isLoading: true, error: null })
    try {
      const repos = await window.api.repository.getAll()
      set({ repositories: repos, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '加载仓库列表失败',
        isLoading: false 
      })
    }
  },

  // 设置当前仓库
  setCurrentRepository: (repo) => {
    set({ currentRepository: repo })
    if (repo) {
      // 更新最后打开时间
      window.api.repository.update(repo.path, { 
        lastOpened: new Date().toISOString() 
      })
    }
  },

  // 添加仓库
  addRepository: async (path) => {
    set({ isLoading: true, error: null })
    try {
      const repo = await window.api.repository.add(path)
      const { repositories } = get()
      set({ 
        repositories: [...repositories, repo],
        isLoading: false 
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '添加仓库失败',
        isLoading: false 
      })
    }
  },

  // 移除仓库
  removeRepository: async (path) => {
    set({ isLoading: true, error: null })
    try {
      await window.api.repository.remove(path)
      const { repositories, currentRepository } = get()
      set({ 
        repositories: repositories.filter(r => r.path !== path),
        currentRepository: currentRepository?.path === path ? null : currentRepository,
        isLoading: false 
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '移除仓库失败',
        isLoading: false 
      })
    }
  },

  // 切换收藏
  toggleFavorite: async (path) => {
    try {
      await window.api.repository.toggleFavorite(path)
      const { repositories } = get()
      set({ 
        repositories: repositories.map(r => 
          r.path === path ? { ...r, isFavorite: !r.isFavorite } : r
        )
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '切换收藏失败'
      })
    }
  },

  // 更新仓库信息
  updateRepository: async (path, data) => {
    try {
      await window.api.repository.update(path, data)
      const { repositories } = get()
      set({ 
        repositories: repositories.map(r => 
          r.path === path ? { ...r, ...data } : r
        )
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '更新仓库失败'
      })
    }
  },
}))