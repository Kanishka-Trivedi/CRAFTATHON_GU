import React from 'react';
import { Navigate, usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return null; // Or a loader

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;

  // Simple check: In real app, check for user.role === 'admin'
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
};
