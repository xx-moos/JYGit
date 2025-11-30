import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      // Git 操作相关 API
      git: {
        // 仓库操作
        init: (path: string) => Promise<any>
        clone: (url: string, path: string) => Promise<any>
        open: (path: string) => Promise<any>
        selectRepo: () => Promise<any>
        openRepo: (path: string) => Promise<any>
        
        // 状态和历史
        status: () => Promise<any>
        log: (options?: { maxCount?: number; ref?: string }) => Promise<any>
        diff: (options?: { cached?: boolean; path?: string }) => Promise<any>
        
        // 暂存区操作
        add: (files: string[]) => Promise<any>
        addAll: () => Promise<any>
        reset: (files?: string[]) => Promise<any>
        commit: (options: { message: string; amend?: boolean }) => Promise<any>
        
        // 分支操作
        branches: () => Promise<any>
        createBranch: (name: string, checkout?: boolean) => Promise<any>
        checkout: (ref: string) => Promise<any>
        deleteBranch: (name: string, force?: boolean) => Promise<any>
        merge: (branch: string) => Promise<any>
        
        // 远程操作
        fetch: (remote?: string) => Promise<any>
        pull: (options?: { remote?: string; branch?: string; rebase?: boolean }) => Promise<any>
        push: (options?: { remote?: string; branch?: string; force?: boolean; setUpstream?: boolean }) => Promise<any>
        
        // 远程仓库管理
        remotes: () => Promise<any>
        addRemote: (name: string, url: string) => Promise<any>
        removeRemote: (name: string) => Promise<any>
        
        // 其他操作
        discard: (files?: string | string[]) => Promise<any>
        testSSH: () => Promise<boolean>
      }
      
      // 文件系统操作
      fs: {
        selectDirectory: () => Promise<string | null>
        selectFile: (options?: { title?: string; filters?: Array<{ name: string; extensions: string[] }> }) => Promise<string | null>
        readFile: (path: string) => Promise<string>
        writeFile: (path: string, content: string) => Promise<void>
        exists: (path: string) => Promise<boolean>
      }
      
      // 仓库管理
      repository: {
        getAll: () => Promise<any[]>
        add: (path: string) => Promise<any>
        remove: (path: string) => Promise<any>
        update: (path: string, data: any) => Promise<any>
        toggleFavorite: (path: string) => Promise<any>
      }
    }
  }
}