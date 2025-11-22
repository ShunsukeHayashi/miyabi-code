import { useEffect, useState } from 'react';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import { useAuth } from '../contexts/AuthContext';

interface SessionTimeoutWarningProps {
  // Session timeout in milliseconds (default: 30 minutes)
  sessionTimeout?: number;
  // Warning time before timeout in milliseconds (default: 5 minutes)
  warningTime?: number;
}

const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  sessionTimeout = 30 * 60 * 1000, // 30 minutes
  warningTime = 5 * 60 * 1000, // 5 minutes before timeout
}) => {
  const { isAuthenticated, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Track user activity
  useEffect(() => {
    const resetTimer = () => {
      setLastActivity(Date.now());
      setShowWarning(false);
    };

    // Events that indicate user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  // Check session timeout
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity;
      const remaining = sessionTimeout - elapsed;

      if (remaining <= 0) {
        // Session expired
        logout();
      } else if (remaining <= warningTime) {
        // Show warning
        setShowWarning(true);
        setTimeLeft(Math.ceil(remaining / 1000));
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, lastActivity, sessionTimeout, warningTime, logout]);

  // Continue session
  const handleContinue = () => {
    setLastActivity(Date.now());
    setShowWarning(false);
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated) return null;

  return (
    <Modal
      isOpen={showWarning}
      onClose={handleContinue}
      backdrop="blur"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⏰</span>
            <span>セッションタイムアウト</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <p className="text-gray-600">
            セキュリティのため、まもなくセッションが終了します。
          </p>
          <div className="text-center py-4">
            <p className="text-4xl font-bold text-primary">
              {formatTime(timeLeft)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              で自動ログアウトします
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={logout}>
            ログアウト
          </Button>
          <Button color="primary" onPress={handleContinue}>
            セッションを継続
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SessionTimeoutWarning;
