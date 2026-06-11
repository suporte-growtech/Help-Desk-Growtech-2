import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { ThemeToggle } from './ui/ThemeToggle'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import {
  LayoutDashboard, Ticket, Monitor, LogOut, Menu, X, HardDrive, Clock, Users, UserCog, Mail, Server
} from 'lucide-react'
import { useState } from 'react'

export function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const links = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/tickets', icon: Ticket, label: 'Chamados' },
    { to: '/admin/notebooks', icon: Monitor, label: 'Notebooks' },
    { to: '/admin/users', icon: UserCog, label: 'Usuários' },
    { to: '/admin/emails', icon: Mail, label: 'Emails' },
    { to: '/admin/servers', icon: Server, label: 'Servidores' },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <HardDrive className="text-primary" size={28} />
            <span className="text-xl font-bold text-gray-900 dark:text-white">GrowTech</span>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          {links.map(link => {
            const Icon = link.icon
            const active = location.pathname === link.to || 
              (link.to !== '/admin' && location.pathname.startsWith(link.to))
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                {link.label}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium text-gray-900 dark:text-white">{profile?.name}</p>
              <p className="text-xs capitalize">Admin</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-danger transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6">
          <button
            className="lg:hidden p-2 text-gray-600 dark:text-gray-400"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white hidden sm:block">
            Help Desk GrowTech
          </h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export function UserLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const links = [
    { to: '/user', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/user/new-ticket', icon: Ticket, label: 'Novo Chamado' },
    { to: '/user/my-tickets', icon: Clock, label: 'Meus Chamados' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HardDrive className="text-primary" size={28} />
              <span className="text-xl font-bold text-gray-900 dark:text-white">GrowTech</span>
            </div>
            <div className="hidden sm:flex items-center gap-1">
              {links.map(link => {
                const Icon = link.icon
                const active = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon size={18} />
                    {link.label}
                  </Link>
                )
              })}
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Users size={18} />
                <span>{profile?.name}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-danger transition-all"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
              <button
                className="sm:hidden p-2 text-gray-600 dark:text-gray-400"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
        {menuOpen && (
          <div className="sm:hidden border-t border-gray-200 dark:border-gray-800 p-4 space-y-2">
            {links.map(link => {
              const Icon = link.icon
              const active = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon size={18} />
                  {link.label}
                </Link>
              )
            })}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                <Users size={18} />
                <span>{profile?.name}</span>
              </div>
            </div>
          </div>
        )}
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  )
}
