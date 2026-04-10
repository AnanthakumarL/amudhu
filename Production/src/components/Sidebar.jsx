import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, LogOut } from 'lucide-react'
import clsx from 'clsx'
import { clearStoredUser } from '../services/authStorage'

const Sidebar = () => {
  const location = useLocation()

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ShoppingCart, label: 'Orders', path: '/orders' },
  ]

  const logout = () => {
    clearStoredUser()
    window.location.href = '/login'
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-white border-r border-dark-200 z-50 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-dark-100">
        <div className="font-heading font-bold text-lg text-dark-900">Production Panel</div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-3 px-3 py-3 rounded-xl transition-colors',
                isActive
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-dark-500 hover:bg-dark-50 hover:text-dark-900'
              )}
            >
              <item.icon
                size={20}
                className={clsx(isActive ? 'text-violet-600' : 'text-dark-400')}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-dark-100">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-dark-700 hover:bg-dark-50 transition-colors"
          type="button"
        >
          <LogOut size={20} className="flex-shrink-0" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
