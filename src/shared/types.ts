export interface GitStatus {
  staged: string[]
  unstaged: string[]
  untracked: string[]
  conflicted: string[]
}

export interface GitBranch {
  name: string
  current: boolean
  remote?: string
  ahead?: number
  behind?: number
}

export interface GitCommit {
  hash: string
  shortHash: string
  message: string
  author: string
  email: string
  date: string
  parents: string[]
}

export interface GitRemote {
  name: string
  fetchUrl: string
  pushUrl: string
}

export interface GitDiff {
  file: string
  additions: number
  deletions: number
  hunks: GitDiffHunk[]
}

export interface GitDiffHunk {
  header: string
  lines: GitDiffLine[]
}

export interface GitDiffLine {
  type: 'add' | 'delete' | 'context'
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

export interface GitFileChange {
  path: string
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'untracked'
  staged: boolean
  oldPath?: string
}

export interface Repository {
  path: string
  name: string
  lastOpened?: string
  isFavorite?: boolean
  branch?: string
  ahead?: number
  behind?: number
}