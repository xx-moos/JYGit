import { app } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import type { Repository } from '../../shared/types'

export class RepositoryManager {
  private repositories: Map<string, Repository> = new Map()
  private configPath: string
  private initialized = false

  constructor() {
    this.configPath = join(app.getPath('userData'), 'repositories.json')
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      const data = await fs.readFile(this.configPath, 'utf-8')
      const repos: Repository[] = JSON.parse(data)
      repos.forEach(repo => {
        this.repositories.set(repo.path, repo)
      })
    } catch (error) {
      // 文件不存在或解析失败，使用空列表
      console.log('No existing repositories config found, starting fresh')
    }

    this.initialized = true
  }

  private async save(): Promise<void> {
    const repos = Array.from(this.repositories.values())
    await fs.writeFile(this.configPath, JSON.stringify(repos, null, 2), 'utf-8')
  }

  async getAll(): Promise<Repository[]> {
    await this.initialize()
    return Array.from(this.repositories.values())
  }

  async add(path: string): Promise<Repository> {
    await this.initialize()

    if (this.repositories.has(path)) {
      return this.repositories.get(path)!
    }

    const repo: Repository = {
      path,
      name: path.split(/[/\\]/).pop() || path,
      lastOpened: new Date().toISOString(),
      isFavorite: false
    }

    this.repositories.set(path, repo)
    await this.save()
    return repo
  }

  async remove(path: string): Promise<void> {
    await this.initialize()

    if (!this.repositories.has(path)) {
      throw new Error(`Repository not found: ${path}`)
    }

    this.repositories.delete(path)
    await this.save()
  }

  async update(path: string, data: Partial<Repository>): Promise<Repository> {
    await this.initialize()

    const repo = this.repositories.get(path)
    if (!repo) {
      throw new Error(`Repository not found: ${path}`)
    }

    const updated = { ...repo, ...data, path } // path 不能被修改
    this.repositories.set(path, updated)
    await this.save()
    return updated
  }

  async updateLastOpened(path: string): Promise<void> {
    await this.update(path, { lastOpened: new Date().toISOString() })
  }
}

// 单例实例
export const repositoryManager = new RepositoryManager()