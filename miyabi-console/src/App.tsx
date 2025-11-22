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
        <Route index element={<DashboardPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/deployment" element={<DeploymentPipelinePage />} />
        <Route path="/infrastructure" element={<InfrastructurePage />} />
        <Route path="/database" element={<DatabasePage />} />
      </Route>
    </Routes>
  )
}

export default App
