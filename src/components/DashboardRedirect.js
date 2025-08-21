import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardRedirect = () => {
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
  switch (userRole) {
    case 'superadmin':
      return <Navigate to="/superadmin" replace />;
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'chef':
      return <Navigate to="/chef" replace />;
    case 'reception':
      return <Navigate to="/reception" replace />;
    default:
      // Fallback for any other roles
      return <Navigate to="/admin" replace />;
  }
};

export default DashboardRedirect; 