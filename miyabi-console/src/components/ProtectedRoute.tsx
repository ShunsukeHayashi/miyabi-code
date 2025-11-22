import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from '@heroui/react';
import { gradients } from '../design-system/colors';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Development mode: skip authentication if DEV_MODE is enabled
  const isDevelopmentMode = import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV;

  if (isDevelopmentMode) {
    console.log('🔓 Development mode: Authentication bypassed');
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: gradients.background }}
      >
        <div className="text-center space-y-4">
          <Spinner size="lg" color="primary" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
