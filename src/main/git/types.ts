/**
 * Git 仓库状态
 */
export interface GitStatus {
  /** 当前分支 */
  current: string
  /** 跟踪的远程分支 */
  tracking: string | null
  /** 未暂存的文件 */
  modified: string[]
  /** 已暂存的文件 */
  staged: string[]
  /** 未追踪的文件 */
  notAdded: string[]
  /** 已删除的文件 */
  deleted: string[]
  /** 重命名的文件 */
  renamed: { from: string; to: string }[]
  /** 冲突的文件 */
  conflicted: string[]
  /** 领先的提交数 */
  ahead: number
  /** 落后的提交数 */
  behind: number
  /** 是否有未提交的更改 */
  isClean: boolean
}

/**
 * Git 提交信息
 */
export interface GitCommit {
  /** 提交哈希 */
  hash: string
  /** 短哈希 */
  shortHash: string
  /** 提交信息 */
  message: string
  /** 提交日期 */
  date: string
  /** 作者名称 */
  author: string
  /** 作者邮箱 */
  email: string
  /** 引用（分支/标签） */
  refs: string
}

/**
 * Git 分支信息
 */
export interface GitBranch {
  /** 分支名称 */
  name: string
  /** 是否为当前分支 */
  current: boolean
  /** 提交哈希 */
  commit: string
  /** 是否为远程分支 */
  isRemote: boolean
}

/**
 * Git 远程仓库信息
 */
export interface GitRemote {
  /** 远程仓库名称 */
  name: string
  /** fetch URL */
  fetchUrl: string
  /** push URL */
  pushUrl: string
}

/**
 * Git 文件差异
 */
export interface GitDiff {
  /** 文件路径 */
  file: string
  /** 变更类型 */
  type: 'added' | 'modified' | 'deleted' | 'renamed'
  /** 添加的行数 */
  insertions: number
  /** 删除的行数 */
  deletions: number
  /** 差异内容 */
  diff: string
}

/**
 * Git 标签信息
 */
export interface GitTag {
  /** 标签名称 */
  name: string
  /** 提交哈希 */
  commit: string
  /** 标签信息 */
  message?: string
  /** 创建日期 */
  date?: string
}

/**
 * Git Stash 信息
 */
export interface GitStash {
  /** stash 索引 */
  index: number
  /** stash 消息 */
  message: string
  /** 创建日期 */
  date: string
}

/**
 * Git 仓库信息
 */
export interface GitRepoInfo {
  /** 仓库路径 */
  path: string
  /** 仓库名称 */
  name: string
  /** 是否为有效仓库 */
  isRepo: boolean
  /** 当前分支 */
  currentBranch?: string
  /** 远程仓库 */
  remotes?: GitRemote[]
}

/**
 * 克隆选项
 */
export interface CloneOptions {
  /** 仓库 URL */
  url: string
  /** 目标路径 */
  path: string
  /** 分支名称 */
  branch?: string
  /** 递归克隆子模块 */
  recursive?: boolean
}

/**
 * 提交选项
 */
export interface CommitOptions {
  /** 提交信息 */
  message: string
  /** 是否允许空提交 */
  allowEmpty?: boolean
  /** 是否修改上一次提交 */
  amend?: boolean
}

/**
 * 推送选项
 */
export interface PushOptions {
  /** 远程仓库名称 */
  remote?: string
  /** 分支名称 */
  branch?: string
  /** 是否强制推送 */
  force?: boolean
  /** 是否设置上游分支 */
  setUpstream?: boolean
}

/**
 * 拉取选项
 */
export interface PullOptions {
  /** 远程仓库名称 */
  remote?: string
  /** 分支名称 */
  branch?: string
  /** 是否使用 rebase */
  rebase?: boolean
}

/**
 * 日志选项
 */
export interface LogOptions {
  /** 最大数量 */
  maxCount?: number
  /** 文件路径 */
  file?: string
  /** 起始哈希 */
  from?: string
  /** 结束哈希 */
  to?: string
}