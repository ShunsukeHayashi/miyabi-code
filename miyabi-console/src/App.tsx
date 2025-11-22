import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import AgentsPage from './pages/AgentsPage'
import DashboardPage from './pages/DashboardPage'
import DatabasePage from './pages/DatabasePage'
import DeploymentPipelinePage from './pages/DeploymentPipelinePage'
import InfrastructurePage from './pages/InfrastructurePage'
import OrganizationsPage from './pages/OrganizationsPage'
import WorkflowsPage from './pages/WorkflowsPage'

import ProtectedRoute from './components/ProtectedRoute'
import SessionTimeoutWarning from './components/SessionTimeoutWarning'
import AuthCallbackPage from './pages/AuthCallbackPage'
import LoginPage from './pages/LoginPage'

function App() {
  return (
    <>
      {/* Session timeout warning modal - monitors inactivity */}
      <SessionTimeoutWarning
        sessionTimeout={30 * 60 * 1000}  // 30 minutes
        warningTime={5 * 60 * 1000}      // 5 minutes before timeout
      />

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

        {/* Workflows - admin and developer */}
        <Route path="/workflows" element={
          <ProtectedRoute requiredRole={['admin', 'developer']}>
            <WorkflowsPage />
          </ProtectedRoute>
        } />

        {/* Organizations - admin and developer */}
        <Route path="/organizations" element={
          <ProtectedRoute requiredRole={['admin', 'developer']}>
            <OrganizationsPage />
          </ProtectedRoute>
        } />

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
    </>
  )
}

export default App
