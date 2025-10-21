import React from "react";
import { Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, Badge } from "@heroui/react";
import { Icon } from "@iconify/react";
import { SystemStatus } from "../types/miyabi-types";
import { ControlPanel } from "./control-panel";
import { NotificationHistory } from "./notification-history";
import { useNotifications } from "../contexts/notification-context";
import { useTheme } from "../contexts/theme-context";
import { useRefresh, RefreshInterval } from "../contexts/refresh-context";
import { useWebSocketContext } from "../contexts/websocket-context";

interface HeaderProps {
  systemStatus?: SystemStatus;
}

export const Header: React.FC<HeaderProps> = ({ systemStatus }) => {
  const isHealthy = systemStatus?.health === "healthy";
  const [isControlPanelOpen, setIsControlPanelOpen] = React.useState(false);
  const [isNotificationHistoryOpen, setIsNotificationHistoryOpen] = React.useState(false);
  const { notifications } = useNotifications();
  const { theme, toggleTheme } = useTheme();
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
    <header className="bg-content1 border-b border-divider py-3 px-4 shadow-sm">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Icon icon="lucide:layers" className="h-6 w-6 text-miyabi-primary" />
            <h1 className="text-xl font-semibold">Miyabi A2A</h1>
          </div>
          <Chip
            color={isHealthy ? "success" : "danger"}
            variant="flat"
            size="sm"
            className="ml-2"
          >
            {isHealthy ? "System Healthy" : "System Issues"}
          </Chip>
          <Chip
            color={isConnected ? "success" : "danger"}
            variant="dot"
            size="sm"
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

          {/* Theme Toggle */}
          <Button
            isIconOnly
            variant="flat"
            color="default"
            onPress={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            <Icon
              icon={theme === "light" ? "lucide:moon" : "lucide:sun"}
              className="h-5 w-5"
            />
          </Button>

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