import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardBody, Button, Chip, Divider, ScrollShadow } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNotifications, Notification } from "../contexts/notification-context";

interface NotificationHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationHistory: React.FC<NotificationHistoryProps> = ({
  isOpen,
  onClose,
}) => {
  const { notifications, clearAll } = useNotifications();

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
        return "success";
      case "error":
        return "danger";
      case "warning":
        return "warning";
      case "info":
        return "primary";
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}秒前`;
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    return date.toLocaleString("ja-JP");
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background shadow-xl"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-divider p-4">
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:bell" className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold">通知履歴</h2>
                </div>
                <Button isIconOnly size="sm" variant="light" onPress={onClose}>
                  <Icon icon="lucide:x" className="h-5 w-5" />
                </Button>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between border-b border-divider p-4">
                <p className="text-sm text-foreground-500">
                  {notifications.length}件の通知
                </p>
                {notifications.length > 0 && (
                  <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    startContent={<Icon icon="lucide:trash-2" className="h-4 w-4" />}
                    onPress={clearAll}
                  >
                    すべて削除
                  </Button>
                )}
              </div>

              {/* Notification List */}
              <ScrollShadow className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                    <Icon
                      icon="lucide:bell-off"
                      className="h-16 w-16 text-foreground-300"
                    />
                    <p className="text-lg font-medium text-foreground-500">
                      通知はありません
                    </p>
                    <p className="text-sm text-foreground-400">
                      システムイベントが発生すると、ここに通知が表示されます
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {notifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className="border-l-4"
                        style={{
                          borderLeftColor:
                            notification.type === "success"
                              ? "rgb(17, 205, 239)"
                              : notification.type === "error"
                              ? "rgb(240, 82, 82)"
                              : notification.type === "warning"
                              ? "rgb(245, 158, 11)"
                              : "rgb(99, 102, 241)",
                        }}
                      >
                        <CardBody className="p-3">
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <Chip
                              color={getColor(notification.type)}
                              variant="flat"
                              size="sm"
                              className="flex-shrink-0"
                            >
                              <Icon icon={getIcon(notification.type)} className="h-4 w-4" />
                            </Chip>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-semibold text-sm">
                                  {notification.title}
                                </h4>
                                <span className="text-xs text-foreground-400 flex-shrink-0">
                                  {formatTimestamp(notification.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-foreground-600 break-words">
                                {notification.message}
                              </p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollShadow>

              {/* Footer */}
              <div className="border-t border-divider p-4">
                <Button
                  fullWidth
                  variant="flat"
                  color="default"
                  onPress={onClose}
                >
                  閉じる
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
