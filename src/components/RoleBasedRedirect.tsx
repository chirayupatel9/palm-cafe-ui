import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CafeInfo from './CafeInfo';

interface RoleBasedRedirectProps {
  children: React.ReactNode;
}

const RoleBasedRedirect: React.FC<RoleBasedRedirectProps> = ({ children }) => {
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

  const userRole = user.role;
  const currentPath = window.location.pathname;

  switch (userRole) {
    case 'superadmin':
      if (!currentPath.startsWith('/superadmin')) {
        return <Navigate to="/superadmin" replace />;
      }
      return <>{children}</>;
    case 'admin':
      if (currentPath.startsWith('/superadmin')) {
        return <Navigate to="/admin" replace />;
      }
      return <>{children}</>;
    case 'chef':
      if (currentPath.startsWith('/admin') || currentPath.startsWith('/superadmin')) {
        return <Navigate to="/chef" replace />;
      }
      return <>{children}</>;
    case 'reception':
      if (currentPath.startsWith('/admin') || currentPath.startsWith('/superadmin')) {
        return <Navigate to="/reception" replace />;
      }
      return <>{children}</>;
    default:
      if (currentPath.startsWith('/superadmin')) {
        return <Navigate to="/admin" replace />;
      }
      return <>{children}</>;
  }
};

export default RoleBasedRedirect;
