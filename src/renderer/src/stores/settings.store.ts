import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface UserSettings {
  // Git 配置
  userName?: string
  userEmail?: string
  
  // 编辑器配置
  editorFontSize: number
  editorTabSize: number
  editorWordWrap: boolean
  
  // 主题配置
  theme: 'light' | 'dark' | 'auto'
  
  // 语言配置
  language: 'zh-CN' | 'en-US'
  
  // 其他配置
  autoFetch: boolean
  fetchInterval: number // 分钟
  confirmBeforePush: boolean
  confirmBeforeDelete: boolean
}

const DEFAULT_SETTINGS: UserSettings = {
  editorFontSize: 14,
  editorTabSize: 2,
  editorWordWrap: true,
  theme: 'auto',
  language: 'zh-CN',
  autoFetch: false,
  fetchInterval: 5,
  confirmBeforePush: true,
  confirmBeforeDelete: true
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<UserSettings>({ ...DEFAULT_SETTINGS })
  const loading = ref(false)

  // 加载设置
  async function loadSettings() {
    try {
      loading.value = true
      const stored = localStorage.getItem('user-settings')
      if (stored) {
        settings.value = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      loading.value = false
    }
  }

  // 保存设置
  async function saveSettings(newSettings: Partial<UserSettings>) {
    try {
      loading.value = true
      settings.value = { ...settings.value, ...newSettings }
      localStorage.setItem('user-settings', JSON.stringify(settings.value))
    } catch (error) {
      console.error('Failed to save settings:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 重置设置
  async function resetSettings() {
    try {
      loading.value = true
      settings.value = { ...DEFAULT_SETTINGS }
      localStorage.removeItem('user-settings')
    } catch (error) {
      console.error('Failed to reset settings:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 更新 Git 用户配置
  async function updateGitConfig(userName: string, userEmail: string) {
    try {
      loading.value = true
      // TODO: 调用主进程设置 Git 全局配置
      settings.value.userName = userName
      settings.value.userEmail = userEmail
      await saveSettings({ userName, userEmail })
    } catch (error) {
      console.error('Failed to update git config:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    settings,
    loading,
    loadSettings,
    saveSettings,
    resetSettings,
    updateGitConfig
  }
})