import { Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell.jsx'
import AgentWorkspaceShell from './components/agent/AgentWorkspaceShell.jsx'
import ProtectedRoute from './components/routing/ProtectedRoute.jsx'
import AccountPage from './pages/AccountPage.jsx'
import BookingsPage from './pages/BookingsPage.jsx'
import AdminWorkspaceShell from './components/admin/AdminWorkspaceShell.jsx'
import AdminAgentApplicationsPage from './pages/admin/AdminAgentApplicationsPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import PropertiesPage from './pages/PropertiesPage.jsx'
import PropertyDetailsPage from './pages/PropertyDetailsPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import AgentBookingsPage from './pages/agent/AgentBookingsPage.jsx'
import AgentDashboardPage from './pages/agent/AgentDashboardPage.jsx'
import AgentInspectionsPage from './pages/agent/AgentInspectionsPage.jsx'
import AgentPropertiesPage from './pages/agent/AgentPropertiesPage.jsx'
import AgentPropertyFormPage from './pages/agent/AgentPropertyFormPage.jsx'
import AgentReviewsPage from './pages/agent/AgentReviewsPage.jsx'
import AgentApplicationPage from './pages/AgentApplicationPage.jsx'
import AdminPropertiesPage from './pages/admin/AdminPropertiesPage.jsx'
import AdminPropertyReviewPage from './pages/admin/AdminPropertyReviewPage.jsx'
import AdminInspectionsPage from './pages/admin/AdminInspectionsPage.jsx'
import AdminBookingsPage from './pages/admin/AdminBookingsPage.jsx'
import AdminReviewsPage from './pages/admin/AdminReviewsPage.jsx'
import MessagesPage from './pages/MessagesPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import ChangePasswordPage from './pages/ChangePasswordPage.jsx'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="properties/:propertyId" element={<PropertyDetailsPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="forgot-password"
          element={<ForgotPasswordPage />}
        />

        <Route
          path="reset-password"
          element={<ResetPasswordPage />}
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path="account"
            element={<AccountPage />}
          />
          <Route
            path="account/security"
            element={<ChangePasswordPage />}
          />
          <Route
            path="bookings"
            element={<BookingsPage />}
          />
          <Route
            path="messages"
            element={<MessagesPage />}
          />

          <Route
            path="messages/:conversationId"
            element={<MessagesPage />}
          />
          <Route
            path="agent-application"
            element={<AgentApplicationPage />}
          />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['agent']} />}>
          <Route path="agent" element={<AgentWorkspaceShell />}>
            <Route index element={<AgentDashboardPage />} />
            <Route path="properties" element={<AgentPropertiesPage />} />
            <Route
              path="properties/new"
              element={<AgentPropertyFormPage />}
            />
            <Route
              path="properties/:propertyId/edit"
              element={<AgentPropertyFormPage />}
            />
            <Route
              path="inspections"
              element={<AgentInspectionsPage />}
            />
            <Route path="bookings" element={<AgentBookingsPage />} />
            <Route path="reviews" element={<AgentReviewsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="admin" element={<AdminWorkspaceShell />}>
            <Route index element={<AdminAgentApplicationsPage />} />

            <Route
              path="properties"
              element={<AdminPropertiesPage />}
            />

            <Route
              path="properties/:propertyId"
              element={<AdminPropertyReviewPage />}
            />

            <Route
              path="reviews"
              element={<AdminReviewsPage />}
            />
            
            <Route
              path="inspections"
              element={<AdminInspectionsPage />}
            />

            <Route
              path="bookings"
              element={<AdminBookingsPage />}
            />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
