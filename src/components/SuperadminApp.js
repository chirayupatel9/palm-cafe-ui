import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { 
  X, LogOut, Building, Shield, Crown, BarChart3, Menu
} from 'lucide-react';
import axios from 'axios';
import DarkModeToggle from './DarkModeToggle';
import ImpersonationBanner from './ImpersonationBanner';
import CafeManagement from './CafeManagement';
import SuperAdminDashboard from './SuperAdminDashboard';
import SuperAdminUserManagement from './SuperAdminUserManagement';
import SuperAdminCafeSettings from './SuperAdminCafeSettings';
import SuperAdminCafeUsers from './SuperAdminCafeUsers';

const SuperadminApp = () => {
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, impersonation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Verify user is superadmin
  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      toast.error('Access denied. Super Admin privileges required.');
      navigate('/');
    }
  }, [user, navigate]);

  const handlePageChange = (page) => {
    setMobileMenuOpen(false);
    switch (page) {
      case 'dashboard':
        navigate('/superadmin');
        break;
      case 'cafe-management':
        navigate('/superadmin/cafes');
        break;
      case 'user-management':
        navigate('/superadmin/users');
        break;
      default:
        navigate('/superadmin');
    }
  };

  const handleLogout = () => {
    logout();
  };

  const renderPage = () => {
    const path = location.pathname;
    
    // Route-based rendering
    // Check for /superadmin/cafes/:cafeId/users
    if (path.match(/^\/superadmin\/cafes\/\d+\/users$/)) {
      return <SuperAdminCafeUsers />;
    }
    
    // Check for /superadmin/cafes/:cafeId (but not /users)
    if (path.match(/^\/superadmin\/cafes\/\d+$/) || path.match(/^\/superadmin\/cafes\/\d+\/?$/)) {
      return <SuperAdminCafeSettings />;
    }
    
    // Check for /superadmin/users
    if (path === '/superadmin/users') {
      return <SuperAdminUserManagement />;
    }
    
    // Check for /superadmin/cafes
    if (path === '/superadmin/cafes') {
      return <CafeManagement />;
    }
    
    // Default to dashboard for /superadmin
    if (path === '/superadmin' || path === '/superadmin/') {
      return <SuperAdminDashboard />;
    }
    
    return <SuperAdminDashboard />;
  };

  // Determine current page for navigation highlighting
  const getCurrentPage = () => {
    const path = location.pathname;
    
    // Check for cafe-specific routes
    if (path.match(/^\/superadmin\/cafes\/\d+/)) {
      return 'cafe-management'; // Highlight cafe management when viewing cafe details
    }
    
    if (path === '/superadmin/users') {
      return 'user-management';
    }
    
    if (path === '/superadmin/cafes') {
      return 'cafe-management';
    }
    
    if (path === '/superadmin' || path === '/superadmin/') {
      return 'dashboard';
    }
    
    return 'dashboard';
  };

  const currentPage = getCurrentPage();


  const navigationItems = [
    { id: 'dashboard', label: 'Overview', icon: BarChart3 },
    { id: 'cafe-management', label: 'Cafes', icon: Building },
    { id: 'user-management', label: 'Users', icon: Shield },
    // Features/Subscriptions and System Settings will be added as separate pages
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
          <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'superadmin') {
    return null;
  }


  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${impersonation?.isImpersonating ? 'pt-16' : ''}`}>
      <Toaster position="top-right" />
      <ImpersonationBanner />
    
      {/* Header */}
      <header className={`bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 ${user?.role === 'superadmin' && !user?.cafe_id ? '' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <Crown className="h-8 w-8 text-yellow-500" />
                <div>
                  <h1 className="text-xl font-bold text-secondary-700 dark:text-gray-100">
                    Super Admin Dashboard
                  </h1>
                  <p className="text-xs text-secondary-500 dark:text-gray-400">
                    System-wide management and monitoring
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* User info */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-secondary-600 dark:text-gray-400">
                <Crown className="h-4 w-4" />
                <span>{user?.username} (Superadmin)</span>
              </div>
              

              {/* Dark mode toggle */}
              <DarkModeToggle />
              
              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-secondary-600 hover:text-secondary-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-secondary-600 hover:text-secondary-700 hover:bg-gray-100"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-4 py-2 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handlePageChange(item.id)}
                  className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    currentPage === item.id
                      ? 'bg-secondary-600 text-white font-semibold shadow-sm'
                      : 'text-secondary-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <nav className="hidden lg:block bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handlePageChange(item.id)}
                  className={`flex items-center px-4 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                    currentPage === item.id
                      ? 'nav-active'
                      : 'nav-inactive'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {renderPage()}
      </main>
    </div>
  );
};

export default SuperadminApp; 