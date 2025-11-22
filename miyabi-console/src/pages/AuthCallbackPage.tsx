import { gradients } from '@/design-system/colors';
import { Card, CardBody, Spinner } from '@heroui/react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(`Authorization failed: ${errorParam}`);
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (!code) {
      setError('No authorization code received');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    // Exchange code for access token
    const exchangeCode = async () => {
      try {
        // Use our MCP server's OAuth endpoint
        const tokenUrl = import.meta.env.VITE_AUTH_TOKEN_URL || 'https://peehmbqw9f.us-east-1.awsapprunner.com/oauth/token';
        const tokenResponse = await axios.post(
          tokenUrl,
          {
            code,
            redirect_uri: `${window.location.origin}/auth/callback`,
          }
        );

        const { access_token } = tokenResponse.data;

        if (access_token) {
          // Store token in localStorage
          localStorage.setItem('access_token', access_token);

          // Redirect to dashboard
          navigate('/');
          // Force a page reload to trigger the AuthContext to check the token
          window.location.reload();
        } else {
          setError('Failed to get access token');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (error: any) {
        console.error('Token exchange failed:', error);
        setError(
          error.response?.data?.error ||
          error.message ||
          'Failed to complete authentication'
        );
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    exchangeCode();
  }, [searchParams, navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: gradients.background }}
    >
      <Card className="max-w-md w-full">
        <CardBody className="p-8 text-center space-y-6">
          {error ? (
            <>
              <div className="text-red-400 text-xl font-semibold">認証エラー</div>
              <p className="text-gray-300">{error}</p>
              <p className="text-sm text-gray-500">ログインページにリダイレクトしています...</p>
            </>
          ) : (
            <>
              <Spinner size="lg" color="primary" />
              <div className="text-xl font-semibold text-gray-300">
                認証処理中...
              </div>
              <p className="text-sm text-gray-500">
                GitHub認証を完了しています
              </p>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default AuthCallbackPage;
