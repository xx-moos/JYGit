import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useReactive } from 'ahooks'
import { useGitStore } from '../../stores/git.store'

/**
 * 仓库详情页面
 */
export function Component() {
  const { repoPath } = useParams<{ repoPath: string }>()
  const navigate = useNavigate()
  const { status, branches, commits, loadStatus, loadBranches, loadCommits } = useGitStore()
  
  const state = useReactive({
    activeTab: 'changes' as 'changes' | 'commits' | 'branches',
    isLoading: true,
  })

  useEffect(() => {
    if (repoPath) {
      const path = decodeURIComponent(repoPath)
      // 打开仓库
      window.api.git.openRepo(path).then((result) => {
        if (result.error) {
          alert(result.error)
          navigate('/')
        } else {
          // 加载仓库数据
          Promise.all([
            loadStatus(),
            loadBranches(),
            loadCommits({ maxCount: 50 }),
          ]).finally(() => {
            state.isLoading = false
          })
        }
      })
    }
  }, [repoPath])

  if (state.isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4" style={{ width: 40, height: 40 }} />
          <p className="text-gray-500">加载仓库中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
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
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {repoPath ? decodeURIComponent(repoPath).split(/[/\\]/).pop() : '仓库'}
              </h1>
              <p className="text-sm text-gray-500">{repoPath && decodeURIComponent(repoPath)}</p>
            </div>
          </div>
        </div>

        {/* Tab 导航 */}
        <div className="flex gap-1 px-4">
          <button
            onClick={() => (state.activeTab = 'changes')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              state.activeTab === 'changes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            变更
            {status && (status.staged.length + status.unstaged.length + status.untracked.length) > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-primary-100 text-primary-800 rounded-full">
                {status.staged.length + status.unstaged.length + status.untracked.length}
              </span>
            )}
          </button>
          <button
            onClick={() => (state.activeTab = 'commits')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              state.activeTab === 'commits'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            提交历史
          </button>
          <button
            onClick={() => (state.activeTab = 'branches')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              state.activeTab === 'branches'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            分支
            {branches.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded-full">
                {branches.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-auto p-4">
        {state.activeTab === 'changes' && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">文件变更</h2>
            {status ? (
              <div className="space-y-4">
                {/* 已暂存 */}
                {status.staged.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      已暂存 ({status.staged.length})
                    </h3>
                    <div className="space-y-1">
                      {status.staged.map((file) => (
                        <div key={file} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                          <span className="text-success-600">M</span>
                          <span className="text-sm">{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 未暂存 */}
                {status.unstaged.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      未暂存 ({status.unstaged.length})
                    </h3>
                    <div className="space-y-1">
                      {status.unstaged.map((file) => (
                        <div key={file} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                          <span className="text-warning-600">M</span>
                          <span className="text-sm">{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 未跟踪 */}
                {status.untracked.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      未跟踪 ({status.untracked.length})
                    </h3>
                    <div className="space-y-1">
                      {status.untracked.map((file) => (
                        <div key={file} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                          <span className="text-gray-500">?</span>
                          <span className="text-sm">{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {status.staged.length === 0 && status.unstaged.length === 0 && status.untracked.length === 0 && (
                  <p className="text-gray-500 text-center py-8">工作区很干净</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">加载中...</p>
            )}
          </div>
        )}

        {state.activeTab === 'commits' && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">提交历史</h2>
            {commits.length > 0 ? (
              <div className="space-y-2">
                {commits.map((commit) => (
                  <div key={commit.hash} className="p-3 border border-gray-200 rounded hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{commit.message}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {commit.author} · {commit.date}
                        </p>
                      </div>
                      <span className="ml-2 px-2 py-1 text-xs font-mono bg-gray-100 text-gray-700 rounded">
                        {commit.shortHash}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">暂无提交</p>
            )}
          </div>
        )}

        {state.activeTab === 'branches' && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">分支列表</h2>
            {branches.length > 0 ? (
              <div className="space-y-2">
                {branches.map((branch) => (
                  <div
                    key={branch.name}
                    className={`p-3 border rounded ${
                      branch.current
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{branch.name}</span>
                        {branch.current && (
                          <span className="px-2 py-0.5 text-xs bg-primary-500 text-white rounded">
                            当前
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {branch.ahead !== undefined && branch.ahead > 0 && (
                          <span className="text-xs text-success-600">↑{branch.ahead}</span>
                        )}
                        {branch.behind !== undefined && branch.behind > 0 && (
                          <span className="text-xs text-warning-600">↓{branch.behind}</span>
                        )}
                        {!branch.current && (
                          <button className="text-sm text-primary-600 hover:text-primary-700">
                            切换
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">暂无分支</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

Component.displayName = 'RepositoryPage'