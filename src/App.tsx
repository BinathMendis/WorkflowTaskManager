import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
import PrivateRoute from './components/layout/PrivateRoute'

import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TaskListPage from './pages/TaskListPage'
import MyTasksPage from './pages/MyTasksPage'
import CreateTaskPage from './pages/CreateTaskPage'
import TaskDetailPage from './pages/TaskDetailPage'
import CompanyListPage from './pages/CompanyListPage'
import NotificationsPage from './pages/NotificationsPage'
import UserListPage from './pages/UserListPage'  // Add this import
import PendingApprovalsPage from './pages/PendingApprovalsPage'
import ReadyToPublishPage from './pages/ReadyToPublishPage'
import TaskCalendarPage from './pages/TaskCalendarPage'
import TaskReportPage from './pages/TaskReportPage'
import TaskSearchPage from './pages/TaskSearchPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            {/* Register route removed - no public registration */}

            {/* All protected routes share Layout */}
            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/calendar" element={<TaskCalendarPage />} />

                {/* User routes */}
                <Route path="/tasks/my-tasks" element={<MyTasksPage />} />

                {/* Full admin routes */}
                <Route element={<PrivateRoute fullAdminOnly />}>
                  <Route path="/tasks" element={<TaskListPage />} />
                  <Route path="/tasks/search" element={<TaskSearchPage />} />
                  <Route path="/tasks/create" element={<CreateTaskPage />} />
                  <Route path="/reports/tasks" element={<TaskReportPage />} />
                  <Route path="/companies" element={<CompanyListPage />} />
                  <Route path="/users" element={<UserListPage />} />  {/* Add this route */}
                </Route>

                {/* Workflow routes */}
                <Route element={<PrivateRoute approverOnly />}>
                  <Route path="/approval/pending" element={<PendingApprovalsPage />} />
                </Route>
                <Route element={<PrivateRoute publisherOnly />}>
                  <Route path="/publish/ready" element={<ReadyToPublishPage />} />
                </Route>

                {/* Dynamic task detail — accessible to all authenticated users */}
                <Route path="/tasks/:id" element={<TaskDetailPage />} />
              </Route>
            </Route>

            {/* Catch-all redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>

        <ToastContainer
          position="top-right"
          autoClose={3500}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
          draggable
          theme="light"
          toastClassName="rounded-xl shadow-lg text-sm"
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}
