import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Settings {
  // 通用设置
  language: 'zh-CN' | 'en-US'
  theme: 'light' | 'dark' | 'auto'
  autoOpenLastRepo: boolean

  // Git 设置
  gitUserName: string
  gitUserEmail: string
  sshKeyPath: string
  autoPushAfterCommit: boolean
  autoStashBeforePull: boolean

  // 编辑器设置
  editorFontSize: number
  editorFontFamily: string
  editorTabSize: number
  editorShowWhitespace: boolean
  editorWordWrap: boolean

  // Diff 设置
  diffContextLines: number
  diffIgnoreWhitespace: boolean

  // 性能设置
  maxCommitHistory: number
  diffCacheSize: number
  enableVirtualScroll: boolean

  // 实验性功能
  enableWebWorker: boolean
  enableGPUAcceleration: boolean
}

interface SettingsState {
  settings: Settings

  // Actions
  updateSettings: (settings: Partial<Settings>) => void
  resetSettings: () => void
}

const defaultSettings: Settings = {
  // 通用设置
  language: 'zh-CN',
  theme: 'light',
  autoOpenLastRepo: true,

  // Git 设置
  gitUserName: '',
  gitUserEmail: '',
  sshKeyPath: '',
  autoPushAfterCommit: false,
  autoStashBeforePull: true,

  // 编辑器设置
  editorFontSize: 14,
  editorFontFamily: 'Consolas, Monaco, monospace',
  editorTabSize: 2,
  editorShowWhitespace: false,
  editorWordWrap: true,

  // Diff 设置
  diffContextLines: 3,
  diffIgnoreWhitespace: false,

  // 性能设置
  maxCommitHistory: 1000,
  diffCacheSize: 100,
  enableVirtualScroll: true,

  // 实验性功能
  enableWebWorker: false,
  enableGPUAcceleration: true,
}

/**
 * 设置状态管理
 * 使用 zustand 持久化存储用户设置
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      // 更新设置
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }))
      },

      // 重置设置
      resetSettings: () => {
        set({ settings: defaultSettings })
      },
    }),
    {
      name: 'jygit-settings',
    }
  )
)