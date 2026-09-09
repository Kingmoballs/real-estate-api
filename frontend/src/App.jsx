import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell.jsx'
import ProtectedRoute from './components/routing/ProtectedRoute.jsx'

const AgentWorkspaceShell = lazy(() =>
  import('./components/agent/AgentWorkspaceShell.jsx'),
)
const AdminWorkspaceShell = lazy(() =>
  import('./components/admin/AdminWorkspaceShell.jsx'),
)

const AccountPage = lazy(() => import('./pages/AccountPage.jsx'))
const AgentApplicationPage = lazy(() =>
  import('./pages/AgentApplicationPage.jsx'),
)
const BookingsPage = lazy(() => import('./pages/BookingsPage.jsx'))
const ChangePasswordPage = lazy(() =>
  import('./pages/ChangePasswordPage.jsx'),
)
const ForgotPasswordPage = lazy(() =>
  import('./pages/ForgotPasswordPage.jsx'),
)
const HomePage = lazy(() => import('./pages/HomePage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const MessagesPage = lazy(() => import('./pages/MessagesPage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))
const PropertiesPage = lazy(() =>
  import('./pages/PropertiesPage.jsx'),
)
const PropertyDetailsPage = lazy(() =>
  import('./pages/PropertyDetailsPage.jsx'),
)
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'))
const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPasswordPage.jsx'),
)

const AgentBookingsPage = lazy(() =>
  import('./pages/agent/AgentBookingsPage.jsx'),
)
const AgentDashboardPage = lazy(() =>
  import('./pages/agent/AgentDashboardPage.jsx'),
)
const AgentInspectionsPage = lazy(() =>
  import('./pages/agent/AgentInspectionsPage.jsx'),
)
const AgentPropertiesPage = lazy(() =>
  import('./pages/agent/AgentPropertiesPage.jsx'),
)
const AgentPropertyFormPage = lazy(() =>
  import('./pages/agent/AgentPropertyFormPage.jsx'),
)
const AgentReviewsPage = lazy(() =>
  import('./pages/agent/AgentReviewsPage.jsx'),
)

const AdminAgentApplicationsPage = lazy(() =>
  import('./pages/admin/AdminAgentApplicationsPage.jsx'),
)
const AdminBookingsPage = lazy(() =>
  import('./pages/admin/AdminBookingsPage.jsx'),
)
const AdminInspectionsPage = lazy(() =>
  import('./pages/admin/AdminInspectionsPage.jsx'),
)
const AdminPropertiesPage = lazy(() =>
  import('./pages/admin/AdminPropertiesPage.jsx'),
)
const AdminPropertyReviewPage = lazy(() =>
  import('./pages/admin/AdminPropertyReviewPage.jsx'),
)
const AdminReviewsPage = lazy(() =>
  import('./pages/admin/AdminReviewsPage.jsx'),
)

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
