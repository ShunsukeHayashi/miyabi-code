import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import AgentsPage from './pages/AgentsPage';
import CodeGenPage from './pages/CodeGenPage';
import IssuesPage from './pages/IssuesPage';
import PRsPage from './pages/PRsPage';
import WorktreesPage from './pages/WorktreesPage';
import DeploymentsPage from './pages/DeploymentsPage';
import LogsPage from './pages/LogsPage';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FF69B4', // Miyabi pink
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/codegen" element={<CodeGenPage />} />
            <Route path="/issues" element={<IssuesPage />} />
            <Route path="/prs" element={<PRsPage />} />
            <Route path="/worktrees" element={<WorktreesPage />} />
            <Route path="/deployments" element={<DeploymentsPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigProvider>
  );
}

export default App;
