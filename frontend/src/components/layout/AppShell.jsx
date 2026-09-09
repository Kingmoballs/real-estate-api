import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import ConnectivityBanner from '../errors/ConnectivityBanner.jsx'
import RouteLoadingFallback from '../routing/RouteLoadingFallback.jsx'
import AppFooter from './AppFooter.jsx'
import AppHeader from './AppHeader.jsx'

function AppShell() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <ConnectivityBanner />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Outlet />
      </Suspense>
      <AppFooter />
    </div>
  )
}

export default AppShell
