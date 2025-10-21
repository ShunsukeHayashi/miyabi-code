import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardBody, Button } from "@heroui/react";
import { Icon } from "@iconify/react";

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: Date;
  duration?: number; // milliseconds, default 5000
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "timestamp">) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp">) => {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newNotification: Notification = {
        ...notification,
        id,
        timestamp: new Date(),
        duration: notification.duration ?? 5000,
      };

      setNotifications((prev) => {
        const updated = [newNotification, ...prev];
        // Keep only the last N notifications
        return updated.slice(0, maxNotifications);
      });

      // Auto-remove after duration
      if (newNotification.duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, newNotification.duration);
      }
    },
    [maxNotifications]
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification, clearAll }}
    >
      {children}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  );
};

interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemove,
}) => {
  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "lucide:check-circle";
      case "error":
        return "lucide:alert-circle";
      case "warning":
        return "lucide:alert-triangle";
      case "info":
        return "lucide:info";
    }
  };

  const getColor = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "text-miyabi-success";
      case "error":
        return "text-miyabi-error";
      case "warning":
        return "text-yellow-500";
      case "info":
        return "text-miyabi-info";
    }
  };

  const getBgColor = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "bg-success-50 dark:bg-success-900/20";
      case "error":
        return "bg-danger-50 dark:bg-danger-900/20";
      case "warning":
        return "bg-warning-50 dark:bg-warning-900/20";
      case "info":
        return "bg-primary-50 dark:bg-primary-900/20";
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              className={`${getBgColor(notification.type)} border-l-4 ${
                notification.type === "success"
                  ? "border-success"
                  : notification.type === "error"
                  ? "border-danger"
                  : notification.type === "warning"
                  ? "border-warning"
                  : "border-primary"
              }`}
            >
              <CardBody className="flex flex-row items-start gap-3 p-4">
                {/* Icon */}
                <Icon
                  icon={getIcon(notification.type)}
                  className={`h-6 w-6 ${getColor(notification.type)} flex-shrink-0`}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-foreground-600 break-words">
                    {notification.message}
                  </p>

                  {/* Action Button */}
                  {notification.action && (
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      className="mt-2"
                      onPress={() => {
                        notification.action?.onClick();
                        onRemove(notification.id);
                      }}
                    >
                      {notification.action.label}
                    </Button>
                  )}
                </div>

                {/* Close Button */}
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => onRemove(notification.id)}
                  className="flex-shrink-0"
                >
                  <Icon icon="lucide:x" className="h-4 w-4" />
                </Button>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
