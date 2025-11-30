import fs from 'fs-extra'
import path from 'path'
import { app } from 'electron'
import type { Repository } from '../../shared/types'

/**
 * 仓库管理器
 * 负责管理本地仓库列表
 */
export class RepositoryManager {
  private configPath: string
  private repositories: Repository[] = []

  constructor() {
    // 配置文件路径
    this.configPath = path.join(app.getPath('userData'), 'repositories.json')
    this.loadRepositories()
  }

  /**
   * 加载仓库列表
   */
  private async loadRepositories(): Promise<void> {
    try {
      if (await fs.pathExists(this.configPath)) {
        const data = await fs.readJSON(this.configPath)
        this.repositories = data.repositories || []
      }
    } catch (error) {
      console.error('加载仓库列表失败:', error)
      this.repositories = []
    }
  }

  /**
   * 保存仓库列表
   */
  private async saveRepositories(): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.configPath))
      await fs.writeJSON(this.configPath, { repositories: this.repositories }, { spaces: 2 })
    } catch (error) {
      console.error('保存仓库列表失败:', error)
    }
  }

  /**
   * 获取所有仓库
   */
  async getAll(): Promise<Repository[]> {
    return this.repositories
  }

  /**
   * 添加仓库
   */
  async add(repoPath: string): Promise<Repository> {
    // 检查是否已存在
    const existing = this.repositories.find(r => r.path === repoPath)
    if (existing) {
      return existing
    }

    // 创建新仓库记录
    const repo: Repository = {
      path: repoPath,
      name: path.basename(repoPath),
      lastOpened: new Date().toISOString(),
      isFavorite: false
    }

    this.repositories.push(repo)
    await this.saveRepositories()

    return repo
  }

  /**
   * 移除仓库
   */
  async remove(repoPath: string): Promise<void> {
    this.repositories = this.repositories.filter(r => r.path !== repoPath)
    await this.saveRepositories()
  }

  /**
   * 更新仓库信息
   */
  async update(repoPath: string, data: Partial<Repository>): Promise<void> {
    const repo = this.repositories.find(r => r.path === repoPath)
    if (repo) {
      Object.assign(repo, data)
      await this.saveRepositories()
    }
  }

  /**
   * 更新最后打开时间
   */
  async updateLastOpened(repoPath: string): Promise<void> {
    await this.update(repoPath, { lastOpened: new Date().toISOString() })
  }

  /**
   * 切换收藏状态
   */
  async toggleFavorite(repoPath: string): Promise<void> {
    const repo = this.repositories.find(r => r.path === repoPath)
    if (repo) {
      repo.isFavorite = !repo.isFavorite
      await this.saveRepositories()
    }
  }
}

// 导出单例
export const repositoryManager = new RepositoryManager()