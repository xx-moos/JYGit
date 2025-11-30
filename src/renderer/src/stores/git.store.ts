import { create } from 'zustand'
import type { GitStatus, GitBranch, GitCommit, GitRemote } from '../../../shared/types'

interface GitState {
  status: GitStatus | null
  branches: GitBranch[]
  commits: GitCommit[]
  remotes: GitRemote[]
  currentBranch: string | null
  isLoading: boolean
  error: string | null

  // Actions
  loadStatus: () => Promise<void>
  loadBranches: () => Promise<void>
  loadCommits: (options?: { maxCount?: number }) => Promise<void>
  loadRemotes: () => Promise<void>
  
  // Git 操作
  stageFiles: (files: string[]) => Promise<void>
  stageAll: () => Promise<void>
  unstageFiles: (files: string[]) => Promise<void>
  commit: (message: string, amend?: boolean) => Promise<void>
  push: (options?: { remote?: string; branch?: string; force?: boolean }) => Promise<void>
  pull: (options?: { remote?: string; branch?: string; rebase?: boolean }) => Promise<void>
  
  // 分支操作
  createBranch: (name: string, checkout?: boolean) => Promise<void>
  checkoutBranch: (name: string) => Promise<void>
  deleteBranch: (name: string, force?: boolean) => Promise<void>
  mergeBranch: (branch: string) => Promise<void>
  
  // 清理
  clearError: () => void
}

/**
 * Git 状态管理
 * 使用 zustand 管理 Git 仓库状态
 */
export const useGitStore = create<GitState>((set, get) => ({
  status: null,
  branches: [],
  commits: [],
  remotes: [],
  currentBranch: null,
  isLoading: false,
  error: null,

  // 加载仓库状态
  loadStatus: async () => {
    set({ isLoading: true, error: null })
    try {
      const status = await window.api.git.status()
      if (status.error) {
        throw new Error(status.error)
      }
      
      // 转换状态格式
      const gitStatus: GitStatus = {
        staged: status.staged || [],
        unstaged: [...(status.modified || []), ...(status.deleted || [])],
        untracked: status.notAdded || [],
        conflicted: status.conflicted || []
      }
      
      set({ 
        status: gitStatus,
        currentBranch: status.current,
        isLoading: false 
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '加载状态失败',
        isLoading: false 
      })
    }
  },

  // 加载分支列表
  loadBranches: async () => {
    set({ isLoading: true, error: null })
    try {
      const branches = await window.api.git.branches()
      if (branches.error) {
        throw new Error(branches.error)
      }
      set({ branches, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '加载分支失败',
        isLoading: false 
      })
    }
  },

  // 加载提交历史
  loadCommits: async (options = {}) => {
    set({ isLoading: true, error: null })
    try {
      const commits = await window.api.git.log(options)
      if (commits.error) {
        throw new Error(commits.error)
      }
      set({ commits, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '加载提交历史失败',
        isLoading: false 
      })
    }
  },

  // 加载远程仓库
  loadRemotes: async () => {
    set({ isLoading: true, error: null })
    try {
      const remotes = await window.api.git.remotes()
      if (remotes.error) {
        throw new Error(remotes.error)
      }
      set({ remotes, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '加载远程仓库失败',
        isLoading: false 
      })
    }
  },

  // 暂存文件
  stageFiles: async (files) => {
    set({ isLoading: true, error: null })
    try {
      const result = await window.api.git.add(files)
      if (result.error) {
        throw new Error(result.error)
      }
      await get().loadStatus()
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '暂存文件失败',
        isLoading: false 
      })
    }
  },

  // 暂存所有文件
  stageAll: async () => {
    set({ isLoading: true, error: null })
    try {
      const result = await window.api.git.addAll()
      if (result.error) {
        throw new Error(result.error)
      }
      await get().loadStatus()
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '暂存所有文件失败',
        isLoading: false 
      })
    }
  },

  // 取消暂存
  unstageFiles: async (files) => {
    set({ isLoading: true, error: null })
    try {
      const result = await window.api.git.reset(files)
      if (result.error) {
        throw new Error(result.error)
      }
      await get().loadStatus()
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '取消暂存失败',
        isLoading: false 
      })
    }
  },

  // 提交
  commit: async (message, amend = false) => {
    set({ isLoading: true, error: null })
    try {
      const result = await window.api.git.commit({ message, amend })
      if (result.error) {
        throw new Error(result.error)
      }
      await get().loadStatus()
      await get().loadCommits()
      set({ isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '提交失败',
        isLoading: false 
      })
    }
  },

  // 推送
  push: async (options = {}) => {
    set({ isLoading: true, error: null })
    try {
      const result = await window.api.git.push(options)
      if (result.error) {
        throw new Error(result.error)
      }
      await get().loadStatus()
      set({ isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '推送失败',
        isLoading: false 
      })
    }
  },

  // 拉取
  pull: async (options = {}) => {
    set({ isLoading: true, error: null })
    try {
      const result = await window.api.git.pull(options)
      if (result.error) {
        throw new Error(result.error)
      }
      await get().loadStatus()
      await get().loadCommits()
      set({ isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '拉取失败',
        isLoading: false 
      })
    }
  },

  // 创建分支
  createBranch: async (name, checkout = true) => {
    set({ isLoading: true, error: null })
    try {
      const result = await window.api.git.createBranch(name, checkout)
      if (result.error) {
        throw new Error(result.error)
      }
      await get().loadBranches()
      if (checkout) {
        set({ currentBranch: name })
      }
      set({ isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '创建分支失败',
        isLoading: false 
      })
    }
  },

  // 切换分支
  checkoutBranch: async (name) => {
    set({ isLoading: true, error: null })
    try {
      const result = await window.api.git.checkout(name)
      if (result.error) {
        throw new Error(result.error)
      }
      set({ currentBranch: name })
      await get().loadStatus()
      await get().loadCommits()
      set({ isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '切换分支失败',
        isLoading: false 
      })
    }
  },

  // 删除分支
  deleteBranch: async (name, force = false) => {
    set({ isLoading: true, error: null })
    try {
      const result = await window.api.git.deleteBranch(name, force)
      if (result.error) {
        throw new Error(result.error)
      }
      await get().loadBranches()
      set({ isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '删除分支失败',
        isLoading: false 
      })
    }
  },

  // 合并分支
  mergeBranch: async (branch) => {
    set({ isLoading: true, error: null })
    try {
      const result = await window.api.git.merge(branch)
      if (result.error) {
        throw new Error(result.error)
      }
      await get().loadStatus()
      await get().loadCommits()
      set({ isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : '合并分支失败',
        isLoading: false 
      })
    }
  },

  // 清理错误
  clearError: () => {
    set({ error: null })
  },
}))