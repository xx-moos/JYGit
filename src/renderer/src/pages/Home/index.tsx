import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReactive } from 'ahooks'
import { useRepositoryStore } from '../../stores/repository.store'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

/**
 * 首页组件
 * 显示仓库列表和快速操作
 */
export function Component() {
  const navigate = useNavigate()
  const { repositories, loadRepositories, removeRepository, toggleFavorite } = useRepositoryStore()
  
  const state = useReactive({
    searchQuery: '',
    filterType: 'all' as 'all' | 'favorites' | 'recent',
  })

  useEffect(() => {
    loadRepositories()
  }, [loadRepositories])

  // 打开仓库选择对话框
  const handleSelectRepo = async () => {
    const path = await window.api.fs.selectDirectory()
    if (path) {
      try {
        const result = await window.api.git.openRepo(path)
        if (result.error) {
          alert(result.error)
        } else {
          await loadRepositories()
          navigate(`/repository/${encodeURIComponent(path)}`)
        }
      } catch (error) {
        alert('打开仓库失败')
      }
    }
  }

  // 克隆仓库
  const handleClone = () => {
    navigate('/clone')
  }

  // 打开仓库
  const handleOpenRepo = (path: string) => {
    navigate(`/repository/${encodeURIComponent(path)}`)
  }

  // 移除仓库
  const handleRemoveRepo = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('确定要从列表中移除此仓库吗？（不会删除本地文件）')) {
      await removeRepository(path)
    }
  }

  // 切换收藏
  const handleToggleFavorite = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await toggleFavorite(path)
  }

  // 过滤仓库
  const filteredRepos = repositories.filter(repo => {
    // 搜索过滤
    if (state.searchQuery && !repo.name.toLowerCase().includes(state.searchQuery.toLowerCase())) {
      return false
    }
    
    // 类型过滤
    if (state.filterType === 'favorites' && !repo.isFavorite) {
      return false
    }
    
    return true
  }).sort((a, b) => {
    // 收藏的排在前面
    if (a.isFavorite && !b.isFavorite) return -1
    if (!a.isFavorite && b.isFavorite) return 1
    
    // 按最后打开时间排序
    const aTime = a.lastOpened ? new Date(a.lastOpened).getTime() : 0
    const bTime = b.lastOpened ? new Date(b.lastOpened).getTime() : 0
    return bTime - aTime
  })

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部操作栏 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">JYGit</h1>
          <div className="flex gap-2">
            <button
              onClick={handleClone}
              className="btn btn-secondary"
            >
              克隆仓库
            </button>
            <button
              onClick={handleSelectRepo}
              className="btn btn-primary"
            >
              打开仓库
            </button>
          </div>
        </div>

        {/* 搜索和过滤 */}
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="搜索仓库..."
            value={state.searchQuery}
            onChange={(e) => (state.searchQuery = e.target.value)}
            className="input flex-1"
          />
          <div className="flex gap-2">
            <button
              onClick={() => (state.filterType = 'all')}
              className={`px-3 py-1 rounded ${
                state.filterType === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => (state.filterType = 'favorites')}
              className={`px-3 py-1 rounded ${
                state.filterType === 'favorites'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              收藏
            </button>
          </div>
        </div>
      </div>

      {/* 仓库列表 */}
      <div className="flex-1 overflow-auto p-4">
        {filteredRepos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg
              className="w-24 h-24 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <p className="text-lg">暂无仓库</p>
            <p className="text-sm mt-2">点击"打开仓库"或"克隆仓库"开始使用</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRepos.map((repo) => (
              <div
                key={repo.path}
                onClick={() => handleOpenRepo(repo.path)}
                className="card card-hover cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <svg
                      className="w-5 h-5 text-gray-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    <h3 className="font-semibold text-gray-900 truncate">{repo.name}</h3>
                  </div>
                  <button
                    onClick={(e) => handleToggleFavorite(repo.path, e)}
                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
                  >
                    <svg
                      className={`w-5 h-5 ${
                        repo.isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-400'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </button>
                </div>

                <p className="text-sm text-gray-500 truncate mb-2">{repo.path}</p>

                {repo.branch && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge badge-primary">{repo.branch}</span>
                    {repo.ahead !== undefined && repo.ahead > 0 && (
                      <span className="text-xs text-success-600">↑{repo.ahead}</span>
                    )}
                    {repo.behind !== undefined && repo.behind > 0 && (
                      <span className="text-xs text-warning-600">↓{repo.behind}</span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {repo.lastOpened ? dayjs(repo.lastOpened).fromNow() : '从未打开'}
                  </span>
                  <button
                    onClick={(e) => handleRemoveRepo(repo.path, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                  >
                    <svg
                      className="w-4 h-4 text-gray-400 hover:text-danger-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

Component.displayName = 'HomePage'