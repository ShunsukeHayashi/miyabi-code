import React from "react";
import { Tabs, Tab, Divider, Spinner } from "@heroui/react";
import { LiveDashboard } from "./components/live-dashboard";
import { DashboardRealtime } from "./components/dashboard-realtime";
import { EventTimeline } from "./components/event-timeline";
import { DagVisualizer } from "./components/dag-visualizer";
import { ErrorDashboard } from "./components/error-dashboard";
import { PerformanceAnalytics } from "./components/performance-analytics";
import { Header } from "./components/header";
import { useMiyabiData } from "./hooks/use-miyabi-data";
import { NotificationProvider } from "./contexts/notification-context";
import { ThemeProvider } from "./contexts/theme-context";
import { RefreshProvider } from "./contexts/refresh-context";
import { WebSocketProvider } from "./contexts/websocket-context";

const AppContent: React.FC = () => {
  const [selected, setSelected] = React.useState("production");
  const { isLoading, systemStatus } = useMiyabiData();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" color="primary" />
          <p className="text-lg font-medium text-foreground-600">
            Loading Miyabi A2A Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header systemStatus={systemStatus} />
      <main className="container mx-auto p-4">
        <Tabs
          aria-label="Miyabi A2A Dashboard Tabs"
          selectedKey={selected}
          onSelectionChange={setSelected}
          color="primary"
          variant="underlined"
          className="mb-6"
        >
          <Tab key="production" title="🚀 Production (Rust API)">
            <DashboardRealtime />
          </Tab>
          <Tab key="dashboard" title="Live Dashboard">
            <LiveDashboard />
          </Tab>
          <Tab key="timeline" title="Event Timeline">
            <EventTimeline />
          </Tab>
          <Tab key="workflow" title="Workflow DAG">
            <DagVisualizer />
          </Tab>
          <Tab key="errors" title="Errors & Warnings">
            <ErrorDashboard />
          </Tab>
          <Tab key="analytics" title="パフォーマンス">
            <PerformanceAnalytics />
          </Tab>
        </Tabs>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <RefreshProvider>
        <WebSocketProvider>
          <NotificationProvider maxNotifications={5}>
            <AppContent />
          </NotificationProvider>
        </WebSocketProvider>
      </RefreshProvider>
    </ThemeProvider>
  );
}