import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  GitStatus,
  GitCommit,
  GitBranch,
  GitRemote,
  GitTag,
  GitDiff,
  GitStash
} from '../main/git/types'
import type { Repository } from '../shared/types'

interface GitAPI {
  init: (path: string) => Promise<void>
  clone: (url: string, path: string) => Promise<void>
  open: (path: string) => Promise<{ path: string; name: string }>
  status: () => Promise<GitStatus>
  log: (options?: { maxCount?: number; ref?: string }) => Promise<GitCommit[]>
  diff: (options?: { cached?: boolean; path?: string }) => Promise<GitDiff[]>
  add: (files: string[]) => Promise<void>
  reset: (files: string[]) => Promise<void>
  commit: (message: string, options?: { amend?: boolean }) => Promise<string>
  branch: (options?: { list?: boolean; create?: string; delete?: string }) => Promise<GitBranch[] | void>
  checkout: (ref: string, options?: { create?: boolean }) => Promise<void>
  merge: (branch: string, options?: { noFf?: boolean }) => Promise<void>
  fetch: (remote?: string) => Promise<void>
  pull: (remote?: string, branch?: string) => Promise<void>
  push: (remote?: string, branch?: string, options?: { force?: boolean; setUpstream?: boolean }) => Promise<void>
  remote: (options?: { list?: boolean; add?: { name: string; url: string }; remove?: string }) => Promise<GitRemote[] | void>
  tag: (options?: { list?: boolean; create?: string; delete?: string; message?: string }) => Promise<GitTag[] | void>
  stash: (options?: { save?: string; pop?: boolean; list?: boolean }) => Promise<GitStash[] | void>
}

interface FileSystemAPI {
  selectDirectory: () => Promise<string | null>
  readFile: (path: string) => Promise<string>
  writeFile: (path: string, content: string) => Promise<void>
  exists: (path: string) => Promise<boolean>
}

interface RepositoryAPI {
  getAll: () => Promise<Repository[]>
  add: (path: string) => Promise<void>
  remove: (path: string) => Promise<void>
  update: (path: string, data: Partial<Repository>) => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      git: GitAPI
      fs: FileSystemAPI
      repository: RepositoryAPI
    }
  }
}

export { GitAPI, FileSystemAPI, RepositoryAPI }