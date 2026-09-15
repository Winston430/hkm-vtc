import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { ThemeProvider } from './lib/theme'
import { AuthProvider } from './lib/AuthContext'
import { I18nProvider } from './lib/i18n'
import { ToastProvider } from './lib/toast'
import { BusyProvider } from './lib/busy'
import ProtectedRoute from './components/ProtectedRoute'
import { OfflineBanner } from './components/OfflineBanner'
import AppShell from './layouts/AppShell'
import Login from './features/auth/Login'
import ForgotPassword from './features/auth/ForgotPassword'
import Dashboard from './features/dashboard/Dashboard'
import StudentsList from './features/students/StudentsList'
import RegisterStudent from './features/students/RegisterStudent'
import StudentDetail from './features/students/StudentDetail'
import Courses from './features/courses/Courses'
import Branches from './features/branches/Branches'
import Agents from './features/agents/Agents'
import Payments from './features/payments/Payments'
import Reports from './features/reports/Reports'
import Settings from './features/settings/Settings'
import NotFound from './features/misc/NotFound'

export default function App() {
  return (
    <ThemeProvider>
    <MotionConfig reducedMotion="user">
    <I18nProvider>
      <ToastProvider>
        <BusyProvider>
        <AuthProvider>
          <BrowserRouter>
            <OfflineBanner />
            <Routes>
              {/* public */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* protected app shell */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/students" element={<StudentsList />} />
                <Route path="/students/new" element={<RegisterStudent />} />
                <Route path="/students/:id" element={<StudentDetail />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/branches" element={<Branches />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
                {/* courses, branches, agents, payments — coming next */}
              </Route>

            </Routes>
          </BrowserRouter>
        </AuthProvider>
        </BusyProvider>
      </ToastProvider>
    </I18nProvider>
    </MotionConfig>
    </ThemeProvider>
  )
}