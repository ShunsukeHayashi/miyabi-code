import React from "react";
import { Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, Badge } from "@heroui/react";
import { Icon } from "@iconify/react";
import { SystemStatus } from "../types/miyabi-types";
import { ControlPanel } from "./control-panel";
import { NotificationHistory } from "./notification-history";
import { useNotifications } from "../contexts/notification-context";
import { useRefresh, RefreshInterval } from "../contexts/refresh-context";
import { useWebSocketContext } from "../contexts/websocket-context";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  systemStatus?: SystemStatus;
}

export const Header: React.FC<HeaderProps> = ({ systemStatus }) => {
  const isHealthy = systemStatus?.status === "healthy";
  const [isControlPanelOpen, setIsControlPanelOpen] = React.useState(false);
  const [isNotificationHistoryOpen, setIsNotificationHistoryOpen] = React.useState(false);
  const { notifications } = useNotifications();
  const { interval, setInterval } = useRefresh();
  const { isConnected } = useWebSocketContext();

  // Get API URL for display
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

  const intervalLabels: Record<RefreshInterval, string> = {
    off: "Off",
    "5s": "5 seconds",
    "10s": "10 seconds",
    "30s": "30 seconds",
  };

  return (
    <>
    <header className="bg-content1 border-b border-divider py-3 px-4 shadow-lg backdrop-blur-md animate-in slide-in-from-top duration-500">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:layers" className="h-6 w-6 text-miyabi-primary animate-pulse" />
            <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
              Miyabi A2A
            </h1>
          </div>
          <Chip
            color={isHealthy ? "success" : "danger"}
            variant="flat"
            size="sm"
            className="ml-2 animate-pulse"
          >
            {isHealthy ? "System Healthy" : "System Issues"}
          </Chip>
          <Chip
            color={isConnected ? "success" : "danger"}
            variant="dot"
            size="sm"
            className="animate-pulse"
            startContent={<Icon icon={isConnected ? "lucide:wifi" : "lucide:wifi-off"} className="h-4 w-4" />}
          >
            {apiUrl}
          </Chip>
        </div>
        
        <div className="flex items-center gap-3">
          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="flat"
                color={interval === "off" ? "default" : "primary"}
                startContent={<Icon icon="lucide:refresh-cw" className="h-4 w-4" />}
              >
                Auto-refresh: {intervalLabels[interval]}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Refresh options"
              selectedKeys={new Set([interval])}
              selectionMode="single"
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as RefreshInterval;
                setInterval(selected);
              }}
            >
              <DropdownItem key="off">Off</DropdownItem>
              <DropdownItem key="5s">5 seconds</DropdownItem>
              <DropdownItem key="10s">10 seconds</DropdownItem>
              <DropdownItem key="30s">30 seconds</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {/* Notification Bell */}
          <Badge
            content={notifications.length}
            color="danger"
            isInvisible={notifications.length === 0}
            shape="circle"
          >
            <Button
              isIconOnly
              variant="flat"
              color="default"
              onPress={() => setIsNotificationHistoryOpen(true)}
            >
              <Icon icon="lucide:bell" className="h-5 w-5" />
            </Button>
          </Badge>

          {/* Theme Toggle - Framer Motion強化版 */}
          <ThemeToggle />

          <Button
            color="primary"
            startContent={<Icon icon="lucide:settings" className="h-4 w-4" />}
            onPress={() => setIsControlPanelOpen(true)}
          >
            Settings
          </Button>
        </div>
      </div>
    </header>

    <ControlPanel
      isOpen={isControlPanelOpen}
      onClose={() => setIsControlPanelOpen(false)}
    />

    <NotificationHistory
      isOpen={isNotificationHistoryOpen}
      onClose={() => setIsNotificationHistoryOpen(false)}
    />
    </>
  );
};