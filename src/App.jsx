import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import { ProtectedRoute, AdminRoute } from './components/RouteGuard';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import TransferPage from './pages/TransferPage';
import ProfilePage from './pages/ProfilePage';
import ReauthPage from './pages/ReauthPage';
import SettingsPage from './pages/SettingsPage';
import AdminOverviewPage from './pages/AdminOverviewPage';
import AlertsLogPage from './pages/AlertsLogPage';
import SessionDeepDivePage from './pages/SessionDeepDivePage';
import UserManagementPage from './pages/UserManagementPage';

const router = createBrowserRouter([
  { path: '/', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/dashboard', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
  { path: '/transactions', element: <ProtectedRoute><TransactionsPage /></ProtectedRoute> },
  { path: '/transfer', element: <ProtectedRoute><TransferPage /></ProtectedRoute> },
  { path: '/profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
  { path: '/reauth', element: <ReauthPage /> }, // Modal feel, no guard to allow entry from anywhere
  { path: '/settings', element: <ProtectedRoute><SettingsPage /></ProtectedRoute> },
  
  // Admin Routes
  { path: '/admin', element: <AdminRoute><AdminOverviewPage /></AdminRoute> },
  { path: '/admin/alerts', element: <AdminRoute><AlertsLogPage /></AdminRoute> },
  { path: '/admin/users', element: <AdminRoute><UserManagementPage /></AdminRoute> },
  { path: '/admin/session/:id', element: <AdminRoute><SessionDeepDivePage /></AdminRoute> },
]);

function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <RouterProvider router={router} />
      </AdminProvider>
    </AuthProvider>
  );
}

export default App;
