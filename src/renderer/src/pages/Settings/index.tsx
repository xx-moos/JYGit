import { useReactive } from 'ahooks'
import { useSettingsStore } from '../../stores/settings.store'

interface SettingsState {
  activeTab: 'general' | 'git' | 'editor' | 'advanced'
  testingSSH: boolean
  testResult: string
}

export function Component() {
  const { settings, updateSettings } = useSettingsStore()
  
  const state = useReactive<SettingsState>({
    activeTab: 'general',
    testingSSH: false,
    testResult: ''
  })

  const handleTestSSH = async () => {
    state.testingSSH = true
    state.testResult = ''
    
    try {
      // 测试 SSH 连接
      const result = await window.api.git.testSSH()
      state.testResult = result ? '✓ SSH 连接成功' : '✗ SSH 连接失败'
    } catch (error) {
      state.testResult = `✗ 错误: ${error instanceof Error ? error.message : '未知错误'}`
    } finally {
      state.testingSSH = false
    }
  }

  const handleSelectSSHKey = async () => {
    try {
      const result = await window.api.fs.selectFile({
        title: '选择 SSH 私钥',
        filters: [
          { name: 'SSH Keys', extensions: ['*'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })
      
      if (result) {
        updateSettings({ sshKeyPath: result })
      }
    } catch (error) {
      console.error('选择 SSH 密钥失败:', error)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 标题栏 */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-semibold">设置</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 侧边栏 */}
        <div className="w-48 bg-white border-r">
          <nav className="p-2">
            {[
              { key: 'general', label: '通用', icon: '⚙️' },
              { key: 'git', label: 'Git 配置', icon: '🔧' },
              { key: 'editor', label: '编辑器', icon: '📝' },
              { key: 'advanced', label: '高级', icon: '🔬' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => (state.activeTab = tab.key as any)}
                className={`w-full text-left px-4 py-2 rounded-lg mb-1 flex items-center gap-2 ${
                  state.activeTab === tab.key
                    ? 'bg-primary-50 text-primary-700'
                    : 'hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {state.activeTab === 'general' && (
            <div className="max-w-2xl space-y-6">
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">界面设置</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      语言
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => updateSettings({ language: e.target.value as any })}
                      className="input w-full"
                    >
                      <option value="zh-CN">简体中文</option>
                      <option value="en-US">English</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      主题
                    </label>
                    <select
                      value={settings.theme}
                      onChange={(e) => updateSettings({ theme: e.target.value as any })}
                      className="input w-full"
                    >
                      <option value="light">浅色</option>
                      <option value="dark">深色</option>
                      <option value="auto">跟随系统</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        启动时自动打开上次仓库
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        应用启动时自动打开最后使用的仓库
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoOpenLastRepo}
                      onChange={(e) => updateSettings({ autoOpenLastRepo: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {state.activeTab === 'git' && (
            <div className="max-w-2xl space-y-6">
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Git 用户信息</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      用户名
                    </label>
                    <input
                      type="text"
                      value={settings.gitUserName}
                      onChange={(e) => updateSettings({ gitUserName: e.target.value })}
                      placeholder="Your Name"
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      邮箱
                    </label>
                    <input
                      type="email"
                      value={settings.gitUserEmail}
                      onChange={(e) => updateSettings({ gitUserEmail: e.target.value })}
                      placeholder="your.email@example.com"
                      className="input w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold mb-4">SSH 配置</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SSH 私钥路径
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={settings.sshKeyPath}
                        onChange={(e) => updateSettings({ sshKeyPath: e.target.value })}
                        placeholder="~/.ssh/id_rsa"
                        className="input flex-1"
                      />
                      <button
                        onClick={handleSelectSSHKey}
                        className="btn-secondary"
                      >
                        浏览
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTestSSH}
                      disabled={state.testingSSH}
                      className="btn-primary"
                    >
                      {state.testingSSH ? '测试中...' : '测试 SSH 连接'}
                    </button>
                    {state.testResult && (
                      <span className={`text-sm ${
                        state.testResult.startsWith('✓') ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {state.testResult}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold mb-4">默认行为</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        提交后自动推送
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        提交代码后自动推送到远程仓库
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoPushAfterCommit}
                      onChange={(e) => updateSettings({ autoPushAfterCommit: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        拉取前自动暂存
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        拉取代码前自动暂存本地更改
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoStashBeforePull}
                      onChange={(e) => updateSettings({ autoStashBeforePull: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {state.activeTab === 'editor' && (
            <div className="max-w-2xl space-y-6">
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">编辑器设置</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      字体大小
                    </label>
                    <input
                      type="number"
                      value={settings.editorFontSize}
                      onChange={(e) => updateSettings({ editorFontSize: parseInt(e.target.value) })}
                      min="10"
                      max="24"
                      className="input w-32"
                    />
                    <span className="ml-2 text-sm text-gray-500">px</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      字体
                    </label>
                    <input
                      type="text"
                      value={settings.editorFontFamily}
                      onChange={(e) => updateSettings({ editorFontFamily: e.target.value })}
                      placeholder="Consolas, Monaco, monospace"
                      className="input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tab 大小
                    </label>
                    <input
                      type="number"
                      value={settings.editorTabSize}
                      onChange={(e) => updateSettings({ editorTabSize: parseInt(e.target.value) })}
                      min="2"
                      max="8"
                      className="input w-32"
                    />
                    <span className="ml-2 text-sm text-gray-500">空格</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        显示空白字符
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        在编辑器中显示空格和制表符
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.editorShowWhitespace}
                      onChange={(e) => updateSettings({ editorShowWhitespace: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        自动换行
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        长行自动换行显示
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.editorWordWrap}
                      onChange={(e) => updateSettings({ editorWordWrap: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Diff 视图</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      上下文行数
                    </label>
                    <input
                      type="number"
                      value={settings.diffContextLines}
                      onChange={(e) => updateSettings({ diffContextLines: parseInt(e.target.value) })}
                      min="1"
                      max="10"
                      className="input w-32"
                    />
                    <span className="ml-2 text-sm text-gray-500">行</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        忽略空白字符
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        比较时忽略空白字符的差异
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.diffIgnoreWhitespace}
                      onChange={(e) => updateSettings({ diffIgnoreWhitespace: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {state.activeTab === 'advanced' && (
            <div className="max-w-2xl space-y-6">
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">性能设置</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      最大提交历史数
                    </label>
                    <input
                      type="number"
                      value={settings.maxCommitHistory}
                      onChange={(e) => updateSettings({ maxCommitHistory: parseInt(e.target.value) })}
                      min="100"
                      max="10000"
                      step="100"
                      className="input w-32"
                    />
                    <span className="ml-2 text-sm text-gray-500">条</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Diff 缓存大小
                    </label>
                    <input
                      type="number"
                      value={settings.diffCacheSize}
                      onChange={(e) => updateSettings({ diffCacheSize: parseInt(e.target.value) })}
                      min="10"
                      max="1000"
                      step="10"
                      className="input w-32"
                    />
                    <span className="ml-2 text-sm text-gray-500">MB</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        启用虚拟滚动
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        大列表使用虚拟滚动提升性能
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableVirtualScroll}
                      onChange={(e) => updateSettings({ enableVirtualScroll: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold mb-4">实验性功能</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        启用 Web Worker
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        使用 Web Worker 处理大型 Diff
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableWebWorker}
                      onChange={(e) => updateSettings({ enableWebWorker: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        启用 GPU 加速
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        使用 GPU 加速渲染（需要重启）
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableGPUAcceleration}
                      onChange={(e) => updateSettings({ enableGPUAcceleration: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </div>
                </div>
              </div>

              <div className="card bg-yellow-50 border-yellow-200">
                <h2 className="text-lg font-semibold mb-2 text-yellow-800">⚠️ 危险操作</h2>
                <p className="text-sm text-yellow-700 mb-4">
                  以下操作将清除所有数据，请谨慎操作
                </p>
                
                <div className="space-y-2">
                  <button className="btn-danger">
                    清除所有缓存
                  </button>
                  <button className="btn-danger ml-2">
                    重置所有设置
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

Component.displayName = 'SettingsPage'