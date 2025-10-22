import React, { Suspense } from "react";
import { Tabs, Tab, Divider, Spinner } from "@heroui/react";
import { AdminOverview } from "./components/admin-overview";
import { LiveDashboard } from "./components/live-dashboard";
import { DashboardRealtime } from "./components/dashboard-realtime";
import { DashboardRealtimeEnhanced } from "./components/dashboard-realtime-enhanced";
import { Header } from "./components/header";
import { TabLoadingFallback } from "./components/loading-fallback";
import { useMiyabiData } from "./hooks/use-miyabi-data";
import { NotificationProvider } from "./contexts/notification-context";
import { ThemeProvider } from "./contexts/theme-context";
import { RefreshProvider } from "./contexts/refresh-context";
import { WebSocketProvider } from "./contexts/websocket-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query-client";
import { VoiceCommand } from "./components/voice-command";

// Code-split heavy components with React.lazy
const EventTimeline = React.lazy(() => import("./components/event-timeline").then(module => ({ default: module.EventTimeline })));
const DagVisualizer = React.lazy(() => import("./components/dag-visualizer").then(module => ({ default: module.DagVisualizer })));
const ErrorDashboard = React.lazy(() => import("./components/error-dashboard").then(module => ({ default: module.ErrorDashboard })));
const PerformanceAnalytics = React.lazy(() => import("./components/performance-analytics").then(module => ({ default: module.PerformanceAnalytics })));

const AppContent: React.FC = () => {
  const [selected, setSelected] = React.useState("admin");
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

      {/* ✅ Voice Command - 音声アシスタント */}
      <VoiceCommand
        onCommandExecuted={(command, transcript) => {
          console.log(`Voice command executed: ${command} (${transcript})`);
        }}
      />

      <main className="container mx-auto p-4">
        <Tabs
          aria-label="Miyabi A2A Dashboard Tabs"
          selectedKey={selected}
          onSelectionChange={setSelected}
          color="primary"
          variant="underlined"
          className="mb-6"
        >
          <Tab key="admin" title="📊 Admin Overview">
            <AdminOverview />
          </Tab>
          <Tab key="production" title="🚀 Production (Rust API)">
            <DashboardRealtimeEnhanced />
          </Tab>
          <Tab key="dashboard" title="Live Dashboard">
            <LiveDashboard />
          </Tab>
          <Tab key="timeline" title="Event Timeline">
            <Suspense fallback={<TabLoadingFallback tabName="Event Timeline" />}>
              <EventTimeline />
            </Suspense>
          </Tab>
          <Tab key="workflow" title="Workflow DAG">
            <Suspense fallback={<TabLoadingFallback tabName="Workflow DAG" />}>
              <DagVisualizer />
            </Suspense>
          </Tab>
          <Tab key="errors" title="Errors & Warnings">
            <Suspense fallback={<TabLoadingFallback tabName="Error Dashboard" />}>
              <ErrorDashboard />
            </Suspense>
          </Tab>
          <Tab key="analytics" title="パフォーマンス">
            <Suspense fallback={<TabLoadingFallback tabName="Performance Analytics" />}>
              <PerformanceAnalytics />
            </Suspense>
          </Tab>
        </Tabs>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RefreshProvider>
          <WebSocketProvider>
            <NotificationProvider maxNotifications={5}>
              <AppContent />
            </NotificationProvider>
          </WebSocketProvider>
        </RefreshProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}