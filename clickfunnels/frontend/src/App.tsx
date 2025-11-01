import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './components/Dashboard/Dashboard'
import AIFunnelBuilder from './components/AIFunnelBuilder/AIFunnelBuilder'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/ai-funnel-builder" element={<AIFunnelBuilder />} />
      <Route path="/funnels" element={<div className="p-8">Funnels Page (TODO)</div>} />
      <Route path="/pages" element={<div className="p-8">Pages Page (TODO)</div>} />
      <Route path="/integrations" element={<div className="p-8">Integrations Page (TODO)</div>} />
      <Route path="/analytics" element={<div className="p-8">Analytics Page (TODO)</div>} />
    </Routes>
  )
}

export default App
