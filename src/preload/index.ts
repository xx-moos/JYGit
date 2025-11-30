import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 自定义 API
const api = {
  // Git 操作相关 API
  git: {
    // 仓库操作
    init: (path: string) => ipcRenderer.invoke('git:init', path),
    clone: (url: string, path: string) => ipcRenderer.invoke('git:clone', { url, path }),
    selectRepo: () => ipcRenderer.invoke('git:selectRepo'),
    openRepo: (path: string) => ipcRenderer.invoke('git:openRepo', path),
    
    // 状态和历史
    status: () => ipcRenderer.invoke('git:status'),
    log: (options?: { maxCount?: number; ref?: string }) =>
      ipcRenderer.invoke('git:log', options),
    diff: (options?: { cached?: boolean; path?: string }) =>
      ipcRenderer.invoke('git:diff', options),
    
    // 暂存区操作
    add: (files: string[]) => ipcRenderer.invoke('git:add', files),
    addAll: () => ipcRenderer.invoke('git:addAll'),
    reset: (files?: string[]) => ipcRenderer.invoke('git:reset', files),
    commit: (options: { message: string; amend?: boolean }) =>
      ipcRenderer.invoke('git:commit', options),
    
    // 分支操作
    branches: () => ipcRenderer.invoke('git:branches'),
    createBranch: (name: string, checkout = true) =>
      ipcRenderer.invoke('git:createBranch', name, checkout),
    checkout: (ref: string) => ipcRenderer.invoke('git:checkout', ref),
    deleteBranch: (name: string, force = false) =>
      ipcRenderer.invoke('git:deleteBranch', name, force),
    merge: (branch: string) => ipcRenderer.invoke('git:merge', branch),
    
    // 远程操作
    fetch: (remote?: string) => ipcRenderer.invoke('git:fetch', remote),
    pull: (options?: { remote?: string; branch?: string; rebase?: boolean }) =>
      ipcRenderer.invoke('git:pull', options),
    push: (options?: { remote?: string; branch?: string; force?: boolean; setUpstream?: boolean }) =>
      ipcRenderer.invoke('git:push', options),
    
    // 远程仓库管理
    remotes: () => ipcRenderer.invoke('git:remotes'),
    addRemote: (name: string, url: string) =>
      ipcRenderer.invoke('git:addRemote', name, url),
    removeRemote: (name: string) => ipcRenderer.invoke('git:removeRemote', name),
    
    // 其他操作
    discard: (files?: string | string[]) => ipcRenderer.invoke('git:discard', files),
    testSSH: () => ipcRenderer.invoke('git:testSSH'),
  },
  
  // 文件系统操作
  fs: {
    selectDirectory: () => ipcRenderer.invoke('fs:selectDirectory'),
    selectFile: (options?: { title?: string; filters?: Array<{ name: string; extensions: string[] }> }) =>
      ipcRenderer.invoke('fs:selectFile', options),
    readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
    writeFile: (path: string, content: string) => ipcRenderer.invoke('fs:writeFile', path, content),
    exists: (path: string) => ipcRenderer.invoke('fs:exists', path),
  },
  
  // 仓库管理
  repository: {
    getAll: () => ipcRenderer.invoke('repository:getAll'),
    add: (path: string) => ipcRenderer.invoke('repository:add', path),
    remove: (path: string) => ipcRenderer.invoke('repository:remove', path),
    update: (path: string, data: any) => ipcRenderer.invoke('repository:update', path, data),
    toggleFavorite: (path: string) => ipcRenderer.invoke('repository:toggleFavorite', path),
  }
}

// 使用 contextBridge 暴露 API
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}