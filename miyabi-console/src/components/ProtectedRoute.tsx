import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Spinner } from '@heroui/react';
import { gradients } from '../design-system/colors';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, loading, hasRole } = useAuth();

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

  // Check role authorization if requiredRole is specified
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: gradients.background }}
      >
        <div className="text-center space-y-4">
          <div className="text-6xl">🚫</div>
          <h1 className="text-2xl font-bold text-gray-100">Access Denied</h1>
          <p className="text-gray-400">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
