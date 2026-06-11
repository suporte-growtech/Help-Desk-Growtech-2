import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Loading } from './components/ui/Loading'
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

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, profile, loading, refresh } = useAuth()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    refresh().then(() => setChecking(false))
  }, [])

  if (loading || checking) return <Loading />
  if (!user) return <Navigate to="/" replace />
  if (role && !profile) return <Loading />
  if (role && profile?.role !== role) {
    return <Navigate to={profile?.role === 'admin' ? '/admin' : '/user'} replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      
      <Route path="/admin" element={
        <ProtectedRoute role="admin">
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="tickets" element={<AdminTickets />} />
        <Route path="tickets/:id" element={<AdminTicketDetail />} />
        <Route path="notebooks" element={<AdminNotebooks />} />
      </Route>

      <Route path="/user" element={
        <ProtectedRoute role="user">
          <UserLayout />
        </ProtectedRoute>
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
