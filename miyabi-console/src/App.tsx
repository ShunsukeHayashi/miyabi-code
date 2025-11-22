import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import AgentsPage from './pages/AgentsPage'
import DashboardPage from './pages/DashboardPage'
import DatabasePage from './pages/DatabasePage'
import DeploymentPipelinePage from './pages/DeploymentPipelinePage'
import InfrastructurePage from './pages/InfrastructurePage'

import ProtectedRoute from './components/ProtectedRoute'
import AuthCallbackPage from './pages/AuthCallbackPage'
import LoginPage from './pages/LoginPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        {/* Dashboard - all roles */}
        <Route index element={<DashboardPage />} />

        {/* Agents - all roles */}
        <Route path="/agents" element={<AgentsPage />} />

        {/* Deployment - admin only */}
        <Route path="/deployment" element={
          <ProtectedRoute requiredRole="admin">
            <DeploymentPipelinePage />
          </ProtectedRoute>
        } />

        {/* Infrastructure - admin and developer */}
        <Route path="/infrastructure" element={
          <ProtectedRoute requiredRole={['admin', 'developer']}>
            <InfrastructurePage />
          </ProtectedRoute>
        } />

        {/* Database - admin and developer */}
        <Route path="/database" element={
          <ProtectedRoute requiredRole={['admin', 'developer']}>
            <DatabasePage />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  )
}

export default App
