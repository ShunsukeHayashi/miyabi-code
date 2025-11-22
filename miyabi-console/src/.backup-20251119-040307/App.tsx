import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import AgentsPage from './pages/AgentsPage'
import DashboardPage from './pages/DashboardPage'
import DeploymentPipelinePage from './pages/DeploymentPipelinePage'
import InfrastructureStatusPage from './pages/InfrastructureStatusPage'
import DatabasePage from './pages/DatabasePage'
import DynamicUIPage from './pages/DynamicUIPage'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/deployment" element={<DeploymentPipelinePage />} />
        <Route path="/infrastructure" element={<InfrastructureStatusPage />} />
        <Route path="/database" element={<DatabasePage />} />
        <Route path="/dynamic" element={<DynamicUIPage />} />
      </Route>
    </Routes>
  )
}

export default App
