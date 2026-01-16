import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CafeInfo from './CafeInfo';

const RoleBasedRedirect = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-accent-50 dark:bg-gray-900">
        <CafeInfo logoSize="h-16 w-16" nameSize="text-xl" className="mb-4" />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500"></div>
        <p className="mt-4 text-secondary-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Redirect based on user role
  const userRole = user.role;
  const currentPath = window.location.pathname;
  
  switch (userRole) {
    case 'superadmin':
      // Superadmin can ONLY access /superadmin routes
      if (!currentPath.startsWith('/superadmin')) {
        return <Navigate to="/superadmin" replace />;
      }
      return children;
    case 'admin':
      // Admin can access most routes, but NOT /superadmin
      if (currentPath.startsWith('/superadmin')) {
        return <Navigate to="/admin" replace />;
      }
      return children;
    case 'chef':
      // Chef can only access /chef routes
      if (currentPath.startsWith('/admin') || currentPath.startsWith('/superadmin')) {
        return <Navigate to="/chef" replace />;
      }
      return children;
    case 'reception':
      // Reception can only access /reception routes
      if (currentPath.startsWith('/admin') || currentPath.startsWith('/superadmin')) {
        return <Navigate to="/reception" replace />;
      }
      return children;
    default:
      // Fallback for any other roles - redirect to admin
      if (currentPath.startsWith('/superadmin')) {
        return <Navigate to="/admin" replace />;
      }
      return children;
  }
};

export default RoleBasedRedirect; 