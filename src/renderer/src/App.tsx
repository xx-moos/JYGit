import React from 'react'

function App(): JSX.Element {
  return (
    <div className="h-screen bg-gray-900 text-white">
      <div className="flex h-full">
        {/* 左侧边栏 */}
        <div className="w-64 bg-gray-800 border-r border-gray-700">
          <div className="p-4">
            <h1 className="text-xl font-bold">GitCat</h1>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold">欢迎使用 GitCat</h2>
          </div>
          <div className="flex-1 p-4">
            <p className="text-gray-400">请打开一个 Git 仓库开始使用</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App