import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import AgentsPage from './pages/AgentsPage'
import DashboardPage from './pages/DashboardPage'
import DeploymentPipelinePage from './pages/DeploymentPipelinePage'
import InfrastructurePage from './pages/InfrastructurePage'
import DatabasePage from './pages/DatabasePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
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
