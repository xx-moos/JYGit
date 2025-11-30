import { Outlet } from 'react-router-dom'

/**
 * 应用根组件
 */
function App(): JSX.Element {
  return (
    <div className="h-screen overflow-hidden">
      <Outlet />
    </div>
  )
}

export default App