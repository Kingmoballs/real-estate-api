import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../../features/auth/useAuth.js'

function ProtectedRoute({ allowedRoles }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <main className="page-shell grid min-h-[55vh] place-items-center py-20">
        <div className="flex items-center gap-3 text-sm font-semibold text-stone-600">
          <span className="size-5 animate-spin rounded-full border-2 border-emerald-800 border-t-transparent" />
          Checking your session…
        </div>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
