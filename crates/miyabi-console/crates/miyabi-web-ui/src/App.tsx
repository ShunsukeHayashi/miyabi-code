import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import AgentsPage from './pages/AgentsPage';
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
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigProvider>
  );
}

export default App;
