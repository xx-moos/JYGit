import { createHashRouter } from 'react-router-dom'
import App from '../App'

// 懒加载页面组件
const HomePage = () => import('../pages/Home')
const RepositoryPage = () => import('../pages/Repository')
const SettingsPage = () => import('../pages/Settings')
const ClonePage = () => import('../pages/Clone')

/**
 * 路由配置
 * 使用 HashRouter 避免刷新时的路由问题
 */
export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        lazy: HomePage,
      },
      {
        path: 'repository/:repoPath',
        lazy: RepositoryPage,
      },
      {
        path: 'clone',
        lazy: ClonePage,
      },
      {
        path: 'settings',
        lazy: SettingsPage,
      },
    ],
  },
])