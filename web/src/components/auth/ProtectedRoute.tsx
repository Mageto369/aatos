import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { ReactNode, useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, token, refreshUser } = useAuthStore()
  const [checking, setChecking] = useState(true)
  const location = useLocation()

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('aatos_token')
      if (!isAuthenticated && storedToken) {
        await refreshUser()
      }
      setChecking(false)
    }
    checkAuth()
  }, [isAuthenticated, refreshUser])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const hasToken = token || localStorage.getItem('aatos_token')
  if (!hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
