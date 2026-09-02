import { Outlet } from 'react-router-dom'
import AppFooter from './AppFooter.jsx'
import AppHeader from './AppHeader.jsx'

function AppShell() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <Outlet />
      <AppFooter />
    </div>
  )
}

export default AppShell
