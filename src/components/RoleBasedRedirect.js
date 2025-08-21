import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleBasedRedirect = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-accent-50 dark:bg-gray-900">
        <img 
          src="/images/palm-cafe-logo.png" 
          alt="Palm Cafe Logo" 
          className="h-16 w-16 mb-4"
        />
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
      // Superadmin has access to everything
      return children;
    case 'admin':
      // Admin can access most routes, but not /superadmin
      if (currentPath.startsWith('/superadmin')) {
        return <Navigate to="/admin" replace />;
      }
      return children;
    case 'chef':
      // Redirect chef to chef dashboard if they try to access admin routes
      if (currentPath.startsWith('/admin') || currentPath.startsWith('/superadmin')) {
        return <Navigate to="/chef" replace />;
      }
      return children;
    case 'reception':
      // Redirect reception to reception dashboard if they try to access admin routes
      if (currentPath.startsWith('/admin') || currentPath.startsWith('/superadmin')) {
        return <Navigate to="/reception" replace />;
      }
      return children;
    default:
      // Fallback for any other roles
      return <Navigate to="/admin" replace />;
  }
};

export default RoleBasedRedirect; 