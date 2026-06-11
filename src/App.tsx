import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { Login } from './pages/Login'
import { AdminLayout } from './components/Layout'
import { AdminDashboard } from './pages/admin/Dashboard'
import { AdminTickets } from './pages/admin/Tickets'
import { AdminTicketDetail } from './pages/admin/TicketDetail'
import { AdminNotebooks } from './pages/admin/Notebooks'
import { UserLayout } from './components/Layout'
import { UserDashboard } from './pages/user/Dashboard'
import { NewTicket } from './pages/user/NewTicket'
import { MyTickets } from './pages/user/MyTickets'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { Loading } from './components/ui/Loading'

function AuthGuard({ children, role }: { children: React.ReactNode; role?: string }) {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'redirect'>('loading')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        setStatus('redirect')
        return
      }
      if (role) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        if (!profile || profile.role !== role) {
          setStatus('redirect')
          return
        }
      }
      setStatus('authenticated')
    })
  }, [])

  if (status === 'loading') return <Loading />
  if (status === 'redirect') return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin" element={
        <AuthGuard role="admin">
          <AdminLayout />
        </AuthGuard>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="tickets" element={<AdminTickets />} />
        <Route path="tickets/:id" element={<AdminTicketDetail />} />
        <Route path="notebooks" element={<AdminNotebooks />} />
      </Route>
      <Route path="/user" element={
        <AuthGuard role="user">
          <UserLayout />
        </AuthGuard>
      }>
        <Route index element={<UserDashboard />} />
        <Route path="new-ticket" element={<NewTicket />} />
        <Route path="my-tickets" element={<MyTickets />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              className: '!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-white !shadow-lg',
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
