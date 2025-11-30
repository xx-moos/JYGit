import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 自定义 API
const api = {
  // Git 操作相关 API
  git: {
    // 仓库操作
    init: (path: string) => ipcRenderer.invoke('git:init', path),
    clone: (url: string, path: string) => ipcRenderer.invoke('git:clone', url, path),
    open: (path: string) => ipcRenderer.invoke('git:open', path),
    
    // 状态和历史
    status: () => ipcRenderer.invoke('git:status'),
    log: (options?: { maxCount?: number; ref?: string }) =>
      ipcRenderer.invoke('git:log', options),
    diff: (options?: { cached?: boolean; path?: string }) =>
      ipcRenderer.invoke('git:diff', options),
    
    // 暂存区操作
    add: (files: string[]) => ipcRenderer.invoke('git:add', files),
    reset: (files: string[]) => ipcRenderer.invoke('git:reset', files),
    commit: (message: string, options?: { amend?: boolean }) =>
      ipcRenderer.invoke('git:commit', message, options),
    
    // 分支操作
    branch: (options?: { list?: boolean; create?: string; delete?: string }) =>
      ipcRenderer.invoke('git:branch', options),
    checkout: (ref: string, options?: { create?: boolean }) =>
      ipcRenderer.invoke('git:checkout', ref, options),
    merge: (branch: string, options?: { noFf?: boolean }) =>
      ipcRenderer.invoke('git:merge', branch, options),
    
    // 远程操作
    fetch: (remote?: string) => ipcRenderer.invoke('git:fetch', remote),
    pull: (remote?: string, branch?: string) =>
      ipcRenderer.invoke('git:pull', remote, branch),
    push: (remote?: string, branch?: string, options?: { force?: boolean; setUpstream?: boolean }) =>
      ipcRenderer.invoke('git:push', remote, branch, options),
    
    // 远程仓库管理
    remote: (options?: { list?: boolean; add?: { name: string; url: string }; remove?: string }) =>
      ipcRenderer.invoke('git:remote', options),
    
    // 标签操作
    tag: (options?: { list?: boolean; create?: string; delete?: string; message?: string }) =>
      ipcRenderer.invoke('git:tag', options),
    
    // 其他操作
    stash: (options?: { save?: string; pop?: boolean; list?: boolean }) =>
      ipcRenderer.invoke('git:stash', options),
  },
  
  // 文件系统操作
  fs: {
    selectDirectory: () => ipcRenderer.invoke('fs:selectDirectory'),
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