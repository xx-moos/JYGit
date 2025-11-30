import { ipcMain, dialog } from 'electron'
import { GitService } from './GitService'
import type {
  CloneOptions,
  CommitOptions,
  PushOptions,
  PullOptions,
  LogOptions
} from './types'

// 存储当前打开的仓库实例
let currentGitService: GitService | null = null

/**
 * 注册所有 Git 相关的 IPC 处理器
 */
export function registerGitHandlers(): void {
  // 选择仓库目录
  ipcMain.handle('git:selectRepo', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const repoPath = result.filePaths[0]
    currentGitService = new GitService(repoPath)

    const isRepo = await currentGitService.isRepo()
    if (!isRepo) {
      return {
        error: '所选目录不是有效的 Git 仓库'
      }
    }

    return await currentGitService.getRepoInfo()
  })

  // 打开指定路径的仓库
  ipcMain.handle('git:openRepo', async (_, repoPath: string) => {
    try {
      currentGitService = new GitService(repoPath)
      const isRepo = await currentGitService.isRepo()

      if (!isRepo) {
        return {
          error: '指定路径不是有效的 Git 仓库'
        }
      }

      return await currentGitService.getRepoInfo()
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '打开仓库失败'
      }
    }
  })

  // 初始化仓库
  ipcMain.handle('git:init', async (_, repoPath: string) => {
    try {
      currentGitService = new GitService(repoPath)
      await currentGitService.init()
      return await currentGitService.getRepoInfo()
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '初始化仓库失败'
      }
    }
  })

  // 克隆仓库
  ipcMain.handle('git:clone', async (_, options: CloneOptions) => {
    try {
      currentGitService = await GitService.clone(options)
      return await currentGitService.getRepoInfo()
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '克隆仓库失败'
      }
    }
  })

  // 获取状态
  ipcMain.handle('git:status', async () => {
    if (!currentGitService) {
      return { error: '未打开任何仓库' }
    }

    try {
      return await currentGitService.getStatus()
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '获取状态失败'
      }
    }
  })

  // 添加文件
  ipcMain.handle('git:add', async (_, files: string | string[]) => {
    if (!currentGitService) {
      return { error: '未打开任何仓库' }
    }

    try {
      await currentGitService.add(files)
      return { success: true }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '添加文件失败'
      }
    }
  })

  // 添加所有文件
  ipcMain.handle('git:addAll', async () => {
    if (!currentGitService) {
      return { error: '未打开任何仓库' }
    }

    try {
      await currentGitService.addAll()
      return { success: true }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '添加所有文件失败'
      }
    }
  })

  // 重置文件
  ipcMain.handle('git:reset', async (_, files?: string | string[]) => {
    if (!currentGitService) {
      return { error: '未打开任何仓库' }
    }

    try {
      await currentGitService.reset(files)
      return { success: true }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '重置失败'
      }
    }
  })

  // 提交
  ipcMain.handle('git:commit', async (_, options: CommitOptions) => {
    if (!currentGitService) {
      return { error: '未打开任何仓库' }
    }

    try {
      const commitHash = await currentGitService.commit(options)
      return { success: true, commitHash }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '提交失败'
      }
    }
  })

  // 推送
  ipcMain.handle('git:push', async (_, options?: PushOptions) => {
    if (!currentGitService) {
      return { error: '未打开任何仓库' }
    }

    try {
      await currentGitService.push(options)
      return { success: true }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '推送失败'
      }
    }
  })

  // 拉取
  ipcMain.handle('git:pull', async (_, options?: PullOptions) => {
    if (!currentGitService) {
      return { error: '未打开任何仓库' }
    }

    try {
      await currentGitService.pull(options)
      return { success: true }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '拉取失败'
      }
    }
  })

  // 获取提交历史
  ipcMain.handle('git:log', async (_, options?: LogOptions) => {
    if (!currentGitService) {
      return { error: '未打开任何仓库' }
    }

    try {
      return await currentGitService.getLog(options)
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '获取历史失败'
      }
    }
  })

  // 获取分支列表
  ipcMain.handle('git:branches', async () => {
    if (!currentGitService) {
      return { error: '未打开任何仓库' }
    }

    try {
      return await currentGitService.getBranches()
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '获取分支失败'
      }
    }
  })

  // 创建分支
  ipcMain.handle('git:createBranch', async (_, name: string, checkout = true) => {
    if (!currentGitService) {
      return { error: '未打开任何仓库' }
    }

    try {
      await currentGitService.createBranch(name, checkout)
      return { success: true }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '创建分支失败'
      }
    }
  })

  // 切换分支
  ipcMain.handle('git:checkout', async (_, branch: string) => {
    if (!currentGitService) {
      return { error: '未打开任何仓库' }
    }

    try {
      await currentGitService.checkout(branch)
      return { success: true }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '切换分支失败'
      }
    }
  })

  // 删除分支
  ipcMain.handle('git:deleteBranch', async (_, name: string, force = false) => {
    if (!currentGitService) {
      return { error: '未打开任何仓库' }
    }

    try {
      await currentGitService.deleteBranch(name, force)
      return { success: true }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '删除分支失败'
      }
    }
  })

  // 合并分支
  ipcMain.handle('git:merge', async (_, branch: string) => {
    if (!currentGitService) {
      return { error: '未打开任何仓库' }
    }

    try {
      await currentGitService.merge(branch)
      return { success: true }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '合并分支失败'
      }
    }
  })

  // 获取差异
  ipcMain.handle('git:diff', async (_, file?: string, staged = false) => {
    if (!currentGitService) {
      return { error: '未打开任何仓库' }
    }

    try {
      return await currentGitService.getDiff(file, staged)
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '获取差异失败'
      }
    }
  })

  // 丢弃更改
  ipcMain.handle('git:discard', async (_, files?: string | string[]) => {
    if (!currentGitService) {
      return { error: '未打开任何仓库' }
    }

    try {
      await currentGitService.discardChanges(files)
      return { success: true }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '丢弃更改失败'
      }
    }
  })

  // 获取远程仓库
  ipcMain.handle('git:remotes', async () => {
    if (!currentGitService) {
      return { error: '未打开任何仓库' }
    }

    try {
      return await currentGitService.getRemotes()
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : '获取远程仓库失败'
      }
    }
  })

  // 测试 SSH 连接
  ipcMain.handle('git:testSSH', async () => {
    try {
      // 使用 simple-git 测试 SSH 连接
      // 这里简单测试是否能执行 git 命令
      const { execSync } = require('child_process')
      
      // 在 Windows 上测试 SSH
      try {
        execSync('ssh -T git@github.com', { timeout: 5000 })
        return true
      } catch (error: any) {
        // SSH 测试通常会返回非零退出码，但如果能连接就说明 SSH 配置正确
        // GitHub 的 SSH 测试会返回 "Hi username! You've successfully authenticated"
        if (error.stderr && error.stderr.toString().includes('successfully authenticated')) {
          return true
        }
        return false
      }
    } catch (error) {
      console.error('SSH test error:', error)
      return false
    }
  })
}