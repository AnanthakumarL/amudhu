import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const Layout = () => {
  return (
    <div className="min-h-screen bg-dark-50 flex">
      <Sidebar />

      <main className="flex-1 min-h-screen ml-[260px]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
