import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerGitHandlers } from './git/ipcHandlers'
import { repositoryManager } from './repository/manager'

function createWindow(): void {
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 开发环境加载开发服务器，生产环境加载构建文件
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 注册仓库管理 IPC 处理器
function registerRepositoryHandlers(): void {
  // 获取所有仓库
  ipcMain.handle('repository:getAll', async () => {
    return await repositoryManager.getAll()
  })

  // 添加仓库
  ipcMain.handle('repository:add', async (_, path: string) => {
    return await repositoryManager.add(path)
  })

  // 移除仓库
  ipcMain.handle('repository:remove', async (_, path: string) => {
    await repositoryManager.remove(path)
    return { success: true }
  })

  // 更新仓库
  ipcMain.handle('repository:update', async (_, path: string, data: any) => {
    await repositoryManager.update(path, data)
    return { success: true }
  })

  // 切换收藏
  ipcMain.handle('repository:toggleFavorite', async (_, path: string) => {
    await repositoryManager.toggleFavorite(path)
    return { success: true }
  })
}

// 注册文件系统 IPC 处理器
function registerFileSystemHandlers(): void {
  // 选择目录
  ipcMain.handle('fs:selectDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    
    return result.filePaths[0]
  })

  // 选择文件
  ipcMain.handle('fs:selectFile', async (_event, options?: { title?: string; filters?: Array<{ name: string; extensions: string[] }> }) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: options?.title,
      filters: options?.filters
    })
    
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    
    return result.filePaths[0]
  })
}

// 当 Electron 完成初始化时触发
app.whenReady().then(() => {
  // 为 Windows 设置应用用户模型 ID
  electronApp.setAppUserModelId('com.jygit.app')

  // 注册所有 IPC 处理器
  registerGitHandlers()
  registerRepositoryHandlers()
  registerFileSystemHandlers()

  // 开发环境下默认按 F12 打开或关闭开发工具
  // 生产环境忽略 CommandOrControl + R
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // 在 macOS 上，当点击 dock 图标并且没有其他窗口打开时，
    // 通常会在应用程序中重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 当所有窗口都关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})