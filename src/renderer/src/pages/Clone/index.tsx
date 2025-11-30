import { useNavigate } from 'react-router-dom'
import { useReactive } from 'ahooks'

/**
 * 克隆仓库页面
 */
export function Component() {
  const navigate = useNavigate()
  
  const state = useReactive({
    url: '',
    targetPath: '',
    branch: '',
    isCloning: false,
    progress: 0,
    error: '',
  })

  // 选择目标路径
  const handleSelectPath = async () => {
    const path = await window.api.fs.selectDirectory()
    if (path) {
      state.targetPath = path
    }
  }

  // 克隆仓库
  const handleClone = async () => {
    if (!state.url || !state.targetPath) {
      state.error = '请填写完整信息'
      return
    }

    state.isCloning = true
    state.error = ''
    state.progress = 0

    try {
      const result = await window.api.git.clone(state.url, state.targetPath)
      
      if (result.error) {
        state.error = result.error
        state.isCloning = false
        return
      }

      // 克隆成功，跳转到仓库页面
      navigate(`/repository/${encodeURIComponent(state.targetPath)}`)
    } catch (error) {
      state.error = error instanceof Error ? error.message : '克隆失败'
      state.isCloning = false
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">克隆仓库</h1>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              从远程克隆 Git 仓库
            </h2>

            {/* 错误提示 */}
            {state.error && (
              <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded text-danger-700">
                {state.error}
              </div>
            )}

            {/* 表单 */}
            <div className="space-y-4">
              {/* 仓库 URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  仓库 URL <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/username/repository.git"
                  value={state.url}
                  onChange={(e) => (state.url = e.target.value)}
                  disabled={state.isCloning}
                  className="input w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  支持 HTTPS 和 SSH 协议
                </p>
              </div>

              {/* 目标路径 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目标路径 <span className="text-danger-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="选择克隆到的本地目录"
                    value={state.targetPath}
                    readOnly
                    className="input flex-1 bg-gray-50"
                  />
                  <button
                    onClick={handleSelectPath}
                    disabled={state.isCloning}
                    className="btn btn-secondary"
                  >
                    浏览
                  </button>
                </div>
              </div>

              {/* 分支（可选） */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分支（可选）
                </label>
                <input
                  type="text"
                  placeholder="默认分支"
                  value={state.branch}
                  onChange={(e) => (state.branch = e.target.value)}
                  disabled={state.isCloning}
                  className="input w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  留空则克隆默认分支
                </p>
              </div>

              {/* 进度条 */}
              {state.isCloning && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">克隆中...</span>
                    <span className="text-sm text-gray-600">{state.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${state.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => navigate('/')}
                  disabled={state.isCloning}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleClone}
                  disabled={state.isCloning || !state.url || !state.targetPath}
                  className="btn btn-primary flex-1"
                >
                  {state.isCloning ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="loading-spinner" />
                      克隆中...
                    </span>
                  ) : (
                    '开始克隆'
                  )}
                </button>
              </div>
            </div>

            {/* 提示信息 */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="text-sm font-medium text-blue-900 mb-2">提示</h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• 克隆大型仓库可能需要较长时间，请耐心等待</li>
                <li>• 如果使用 SSH 协议，请确保已配置 SSH 密钥</li>
                <li>• 克隆完成后会自动打开仓库</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

Component.displayName = 'ClonePage'