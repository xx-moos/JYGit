import simpleGit, { SimpleGit, StatusResult, LogResult, BranchSummary } from 'simple-git'
import path from 'path'
import fs from 'fs-extra'
import type {
  GitStatus,
  GitCommit,
  GitBranch,
  GitRemote,
  GitDiff,
  GitTag,
  GitRepoInfo,
  CloneOptions,
  CommitOptions,
  PushOptions,
  PullOptions,
  LogOptions
} from './types'

/**
 * Git 服务类
 * 提供所有 Git 操作的封装
 */
export class GitService {
  private git: SimpleGit
  private repoPath: string

  constructor(repoPath: string) {
    this.repoPath = repoPath
    this.git = simpleGit(repoPath)
  }

  /**
   * 检查是否为有效的 Git 仓库
   */
  async isRepo(): Promise<boolean> {
    try {
      await this.git.status()
      return true
    } catch {
      return false
    }
  }

  /**
   * 初始化 Git 仓库
   */
  async init(): Promise<void> {
    await this.git.init()
  }

  /**
   * 克隆仓库
   */
  static async clone(options: CloneOptions): Promise<GitService> {
    const { url, path: targetPath, branch, recursive } = options
    
    await fs.ensureDir(targetPath)
    
    const git = simpleGit()
    const cloneOptions: string[] = []
    
    if (branch) {
      cloneOptions.push('--branch', branch)
    }
    
    if (recursive) {
      cloneOptions.push('--recursive')
    }
    
    await git.clone(url, targetPath, cloneOptions)
    
    return new GitService(targetPath)
  }

  /**
   * 获取仓库状态
   */
  async getStatus(): Promise<GitStatus> {
    const status: StatusResult = await this.git.status()
    
    return {
      current: status.current || '',
      tracking: status.tracking || null,
      modified: status.modified,
      staged: status.staged,
      notAdded: status.not_added,
      deleted: status.deleted,
      renamed: status.renamed.map(r => ({
        from: r.from,
        to: r.to
      })),
      conflicted: status.conflicted,
      ahead: status.ahead,
      behind: status.behind,
      isClean: status.isClean()
    }
  }

  /**
   * 添加文件到暂存区
   */
  async add(files: string | string[]): Promise<void> {
    await this.git.add(files)
  }

  /**
   * 添加所有文件到暂存区
   */
  async addAll(): Promise<void> {
    await this.git.add('.')
  }

  /**
   * 从暂存区移除文件
   */
  async reset(files?: string | string[]): Promise<void> {
    if (files) {
      await this.git.reset(['HEAD', '--', ...(Array.isArray(files) ? files : [files])])
    } else {
      await this.git.reset(['HEAD'])
    }
  }

  /**
   * 提交更改
   */
  async commit(options: CommitOptions): Promise<string> {
    const { message, allowEmpty, amend } = options
    const commitOptions: string[] = []
    
    if (allowEmpty) {
      commitOptions.push('--allow-empty')
    }
    
    if (amend) {
      commitOptions.push('--amend')
    }
    
    const result = await this.git.commit(message, commitOptions)
    return result.commit
  }

  /**
   * 推送到远程仓库
   */
  async push(options: PushOptions = {}): Promise<void> {
    const { remote = 'origin', branch, force, setUpstream } = options
    const pushOptions: string[] = []
    
    if (force) {
      pushOptions.push('--force')
    }
    
    if (setUpstream) {
      pushOptions.push('--set-upstream')
    }
    
    if (branch) {
      await this.git.push(remote, branch, pushOptions.length > 0 ? pushOptions : undefined)
    } else {
      await this.git.push([remote, ...pushOptions])
    }
  }

  /**
   * 从远程仓库拉取
   */
  async pull(options: PullOptions = {}): Promise<void> {
    const { remote = 'origin', branch, rebase } = options
    const pullOptions: string[] = []
    
    if (rebase) {
      pullOptions.push('--rebase')
    }
    
    if (branch) {
      await this.git.pull(remote, branch, pullOptions.length > 0 ? pullOptions : undefined)
    } else {
      await this.git.pull([remote, ...pullOptions])
    }
  }

  /**
   * 获取提交历史
   */
  async getLog(options: LogOptions = {}): Promise<GitCommit[]> {
    const { maxCount = 100, file, from, to } = options
    
    const logOptions: any = {
      maxCount,
      format: {
        hash: '%H',
        shortHash: '%h',
        message: '%s',
        date: '%ai',
        author: '%an',
        email: '%ae',
        refs: '%D'
      }
    }
    
    if (file) {
      logOptions.file = file
    }
    
    if (from && to) {
      logOptions.from = from
      logOptions.to = to
    }
    
    const log: LogResult = await this.git.log(logOptions)
    
    return log.all.map(commit => ({
      hash: commit.hash,
      shortHash: commit.hash.substring(0, 7),
      message: commit.message,
      date: commit.date,
      author: commit.author_name,
      email: commit.author_email,
      refs: commit.refs || ''
    }))
  }

  /**
   * 获取所有分支
   */
  async getBranches(): Promise<GitBranch[]> {
    const branches: BranchSummary = await this.git.branch(['-a'])
    
    return Object.keys(branches.branches).map(name => {
      const branch = branches.branches[name]
      return {
        name: name.replace('remotes/', ''),
        current: branch.current,
        commit: branch.commit,
        isRemote: name.startsWith('remotes/')
      }
    })
  }

  /**
   * 创建新分支
   */
  async createBranch(name: string, checkout = true): Promise<void> {
    if (checkout) {
      await this.git.checkoutLocalBranch(name)
    } else {
      await this.git.branch([name])
    }
  }

  /**
   * 切换分支
   */
  async checkout(branch: string): Promise<void> {
    await this.git.checkout(branch)
  }

  /**
   * 删除分支
   */
  async deleteBranch(name: string, force = false): Promise<void> {
    await this.git.deleteLocalBranch(name, force)
  }

  /**
   * 合并分支
   */
  async merge(branch: string): Promise<void> {
    await this.git.merge([branch])
  }

  /**
   * 获取远程仓库列表
   */
  async getRemotes(): Promise<GitRemote[]> {
    const remotes = await this.git.getRemotes(true)
    
    return remotes.map(remote => ({
      name: remote.name,
      fetchUrl: remote.refs.fetch,
      pushUrl: remote.refs.push
    }))
  }

  /**
   * 添加远程仓库
   */
  async addRemote(name: string, url: string): Promise<void> {
    await this.git.addRemote(name, url)
  }

  /**
   * 删除远程仓库
   */
  async removeRemote(name: string): Promise<void> {
    await this.git.removeRemote(name)
  }

  /**
   * 获取文件差异
   */
  async getDiff(file?: string, staged = false): Promise<string> {
    const options = staged ? ['--cached'] : []
    
    if (file) {
      options.push('--', file)
    }
    
    return await this.git.diff(options)
  }

  /**
   * 获取标签列表
   */
  async getTags(): Promise<GitTag[]> {
    const tags = await this.git.tags()
    
    return tags.all.map(name => ({
      name,
      commit: ''
    }))
  }

  /**
   * 创建标签
   */
  async createTag(name: string, message?: string): Promise<void> {
    if (message) {
      await this.git.addTag(name)
    } else {
      await this.git.tag(['-a', name, '-m', message!])
    }
  }

  /**
   * 删除标签
   */
  async deleteTag(name: string): Promise<void> {
    await this.git.tag(['-d', name])
  }

  /**
   * 暂存更改
   */
  async stash(message?: string): Promise<void> {
    if (message) {
      await this.git.stash(['save', message])
    } else {
      await this.git.stash()
    }
  }

  /**
   * 应用暂存
   */
  async stashPop(): Promise<void> {
    await this.git.stash(['pop'])
  }

  /**
   * 获取暂存列表
   */
  async getStashList(): Promise<readonly any[]> {
    const result = await this.git.stashList()
    return result.all
  }

  /**
   * 获取仓库信息
   */
  async getRepoInfo(): Promise<GitRepoInfo> {
    const isRepo = await this.isRepo()
    
    if (!isRepo) {
      return {
        path: this.repoPath,
        name: path.basename(this.repoPath),
        isRepo: false
      }
    }
    
    const status = await this.git.status()
    const remotes = await this.getRemotes()
    
    return {
      path: this.repoPath,
      name: path.basename(this.repoPath),
      isRepo: true,
      currentBranch: status.current || undefined,
      remotes
    }
  }

  /**
   * 丢弃工作区更改
   */
  async discardChanges(files?: string | string[]): Promise<void> {
    if (files) {
      const fileList = Array.isArray(files) ? files : [files]
      await this.git.checkout(['--', ...fileList])
    } else {
      await this.git.checkout(['.'])
    }
  }

  /**
   * 获取当前仓库路径
   */
  getRepoPath(): string {
    return this.repoPath
  }
}