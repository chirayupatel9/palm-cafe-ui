import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { X, LogOut, Building, Shield, BarChart3, Menu, Crown } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';
import ImpersonationBanner from './ImpersonationBanner';
import CafeManagement from './CafeManagement';
import SuperAdminDashboard from './SuperAdminDashboard';
import SuperAdminUserManagement from './SuperAdminUserManagement';
import SuperAdminCafeSettings from './SuperAdminCafeSettings';
import SuperAdminCafeUsers from './SuperAdminCafeUsers';

const SuperadminApp: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, impersonation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      toast.error('Access denied. Super Admin privileges required.');
      navigate('/');
    }
  }, [user, navigate]);

  const handlePageChange = (page: string) => {
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
    if (path.match(/^\/superadmin\/cafes\/\d+\/users$/)) {
      return <SuperAdminCafeUsers />;
    }
    if (path.match(/^\/superadmin\/cafes\/\d+$/) || path.match(/^\/superadmin\/cafes\/\d+\/?$/)) {
      return <SuperAdminCafeSettings />;
    }
    if (path === '/superadmin/users') {
      return <SuperAdminUserManagement />;
    }
    if (path === '/superadmin/cafes') {
      return <CafeManagement />;
    }
    if (path === '/superadmin' || path === '/superadmin/') {
      return <SuperAdminDashboard />;
    }
    return <SuperAdminDashboard />;
  };

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.match(/^\/superadmin\/cafes\/\d+/)) return 'cafe-management';
    if (path === '/superadmin/users') return 'user-management';
    if (path === '/superadmin/cafes') return 'cafe-management';
    if (path === '/superadmin' || path === '/superadmin/') return 'dashboard';
    return 'dashboard';
  };

  const currentPage = getCurrentPage();
  const navigationItems = [
    { id: 'dashboard', label: 'Overview', icon: BarChart3 },
    { id: 'cafe-management', label: 'Cafes', icon: Building },
    { id: 'user-management', label: 'Users', icon: Shield }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--surface-page)]">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-64 bg-[var(--surface-table)] rounded animate-pulse mb-4"></div>
          <div className="h-4 w-96 bg-[var(--surface-table)] rounded animate-pulse mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card">
                <div className="h-6 w-32 bg-[var(--surface-table)] rounded animate-pulse mb-4"></div>
                <div className="h-8 w-24 bg-[var(--surface-table)] rounded animate-pulse"></div>
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
    <div className={`min-h-screen bg-[var(--surface-page)] ${impersonation?.isImpersonating ? 'pt-16' : ''}`}>
      <ImpersonationBanner />
      <header className="bg-[var(--surface-nav)] shadow-sm border-b border-[var(--color-outline)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <Crown className="h-8 w-8 text-yellow-500" />
                <div>
                  <h1 className="text-xl font-bold text-on-surface">Super Admin Dashboard</h1>
                  <p className="text-xs text-on-surface-variant">System-wide management and monitoring</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-on-surface-variant">
                <Crown className="h-4 w-4" />
                <span>{user?.username} (Superadmin)</span>
              </div>
              <DarkModeToggle />
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-[var(--surface-table)]"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-[var(--surface-table)] min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-[var(--surface-nav)] border-b border-[var(--color-outline)] shadow-sm">
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
                      : 'text-on-surface hover:bg-[var(--surface-table)]'
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

      <nav className="hidden lg:block bg-[var(--surface-nav)] shadow-sm border-b border-[var(--color-outline)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handlePageChange(item.id)}
                  className={`flex items-center px-4 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                    currentPage === item.id ? 'nav-active' : 'nav-inactive'
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

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">{renderPage()}</main>
    </div>
  );
};

export default SuperadminApp;
