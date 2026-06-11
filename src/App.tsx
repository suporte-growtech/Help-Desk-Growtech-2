import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <Loading />
  if (!user) return <Navigate to="/" />
  if (role && profile?.role !== role) {
    return <Navigate to={profile?.role === 'admin' ? '/admin' : '/user'} />
  }

  return <>{children}</>
}

function PublicRoute() {
  const { user, profile, loading } = useAuth()
  if (loading) return <Loading />
  if (user && profile) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/user'} />
  }
  return <Login />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute />} />
      
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
