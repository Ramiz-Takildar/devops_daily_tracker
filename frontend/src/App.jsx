import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import PrivateRoute from './components/common/PrivateRoute';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Eager load auth pages (small and needed immediately)
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy load main pages (code splitting)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ToolTracker = lazy(() => import('./pages/ToolTracker'));
const ProjectTracker = lazy(() => import('./pages/ProjectTracker'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Goals = lazy(() => import('./pages/Goals'));
const Achievements = lazy(() => import('./pages/Achievements'));
const ToolManagement = lazy(() => import('./pages/ToolManagement'));
const Profile = lazy(() => import('./pages/Profile'));

function AppShell() {
  const { isDark } = useTheme();

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#f1f5f9' : '#0f172a',
            border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`,
            boxShadow: isDark
              ? '0 20px 45px rgba(15, 23, 42, 0.35)'
              : '0 20px 45px rgba(148, 163, 184, 0.25)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: isDark ? '#f1f5f9' : '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: isDark ? '#f1f5f9' : '#ffffff',
            },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Private Routes with Suspense */}
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/tools" element={<ToolTracker />} />
                    <Route path="/projects" element={<ProjectTracker />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/goals" element={<Goals />} />
                    <Route path="/achievements" element={<Achievements />} />
                    <Route path="/tool-management" element={<ToolManagement />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Suspense>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;