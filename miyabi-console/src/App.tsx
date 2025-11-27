import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'

import ProtectedRoute from './components/ProtectedRoute'
import SessionTimeoutWarning from './components/SessionTimeoutWarning'

// Lazy load pages for code splitting
const AgentsPage = lazy(() => import('./pages/AgentsPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const DatabasePage = lazy(() => import('./pages/DatabasePage'))
const DeploymentPipelinePage = lazy(() => import('./pages/DeploymentPipelinePage'))
const InfrastructurePage = lazy(() => import('./pages/InfrastructurePage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))
const OrganizationsPage = lazy(() => import('./pages/OrganizationsPage'))
const WorkflowsPage = lazy(() => import('./pages/WorkflowsPage'))
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const LogsPage = lazy(() => import('./pages/LogsPage'))
const WorktreeManagerPage = lazy(() => import('./pages/WorktreeManagerPage'))
const IssuesPage = lazy(() => import('./pages/IssuesPage'))
const TaskDAGPage = lazy(() => import('./pages/TaskDAGPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage'))

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
    </div>
  )
}

function App() {
  return (
    <>
      {/* Session timeout warning modal - monitors inactivity */}
      <SessionTimeoutWarning
        sessionTimeout={30 * 60 * 1000}  // 30 minutes
        warningTime={5 * 60 * 1000}      // 5 minutes before timeout
      />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          {/* Dashboard - all roles */}
          <Route index element={<DashboardPage />} />

          {/* Agents - all roles */}
          <Route path="/agents" element={<AgentsPage />} />

          {/* Workflows - admin and developer */}
          <Route path="/workflows" element={
            <ProtectedRoute requiredRole={['admin', 'developer']}>
              <WorkflowsPage />
            </ProtectedRoute>
          } />

          {/* Organizations - admin and developer */}
          <Route path="/organizations" element={
            <ProtectedRoute requiredRole={['admin', 'developer']}>
              <OrganizationsPage />
            </ProtectedRoute>
          } />

          {/* Deployment - admin only */}
          <Route path="/deployment" element={
            <ProtectedRoute requiredRole="admin">
              <DeploymentPipelinePage />
            </ProtectedRoute>
          } />

          {/* Infrastructure - admin and developer */}
          <Route path="/infrastructure" element={
            <ProtectedRoute requiredRole={['admin', 'developer']}>
              <InfrastructurePage />
            </ProtectedRoute>
          } />

          {/* Database - admin and developer */}
          <Route path="/database" element={
            <ProtectedRoute requiredRole={['admin', 'developer']}>
              <DatabasePage />
            </ProtectedRoute>
          } />

          {/* Notifications - all roles */}
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Logs - admin and developer */}
          <Route path="/logs" element={
            <ProtectedRoute requiredRole={['admin', 'developer']}>
              <LogsPage />
            </ProtectedRoute>
          } />

          {/* Worktree Manager - admin and developer */}
          <Route path="/worktrees" element={
            <ProtectedRoute requiredRole={['admin', 'developer']}>
              <WorktreeManagerPage />
            </ProtectedRoute>
          } />

          {/* Issues - admin and developer */}
          <Route path="/issues" element={
            <ProtectedRoute requiredRole={['admin', 'developer']}>
              <IssuesPage />
            </ProtectedRoute>
          } />

          {/* Task DAG - admin and developer */}
          <Route path="/task-dag" element={
            <ProtectedRoute requiredRole={['admin', 'developer']}>
              <TaskDAGPage />
            </ProtectedRoute>
          } />

          {/* Analytics - admin and developer */}
          <Route path="/analytics" element={
            <ProtectedRoute requiredRole={['admin', 'developer']}>
              <AnalyticsPage />
            </ProtectedRoute>
          } />

          {/* AI Assistant - all roles */}
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
        </Route>
        </Routes>
      </Suspense>
    </>
  )
}

export default App
