import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Receipt, Settings, Plus, Calculator, FolderOpen, Menu, X, DollarSign, LogOut, User } from 'lucide-react';
import axios from 'axios';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import OrderPage from './components/OrderPage';
import MenuManagement from './components/MenuManagement';
import CategoryManagement from './components/CategoryManagement';
import InvoiceHistory from './components/InvoiceHistory';
import TaxSettings from './components/TaxSettings';
import CurrencySettings from './components/CurrencySettings';
import DarkModeToggle from './components/DarkModeToggle';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';

// Configure axios base URL - use environment variable or fallback to localhost
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
axios.defaults.baseURL = `${API_BASE_URL}/api`;

function MainApp() {
  const [currentPage, setCurrentPage] = useState('order');
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get('/menu');
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMenuItem = async (id, updatedItem) => {
    try {
      await axios.put(`/menu/${id}`, updatedItem);
      fetchMenuItems();
    } catch (error) {
      console.error('Error updating menu item:', error);
    }
  };

  const addMenuItem = async (newItem) => {
    try {
      await axios.post('/menu', newItem);
      fetchMenuItems();
    } catch (error) {
      console.error('Error adding menu item:', error);
    }
  };

  const deleteMenuItem = async (id) => {
    try {
      await axios.delete(`/menu/${id}`);
      fetchMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false); // Close mobile menu when page changes
  };

  const handleLogout = () => {
    logout();
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'order':
        return <OrderPage menuItems={menuItems} />;
      case 'menu':
        return (
          <MenuManagement
            menuItems={menuItems}
            onUpdate={updateMenuItem}
            onAdd={addMenuItem}
            onDelete={deleteMenuItem}
          />
        );
      case 'categories':
        return <CategoryManagement />;
      case 'history':
        return <InvoiceHistory />;
      case 'tax':
        return <TaxSettings />;
      case 'currency':
        return <CurrencySettings />;
      default:
        return <OrderPage menuItems={menuItems} />;
    }
  };

  const navigationItems = [
    { id: 'order', label: 'New Order', icon: Plus },
    { id: 'categories', label: 'Categories', icon: FolderOpen },
    { id: 'menu', label: 'Menu Management', icon: Settings },
    { id: 'history', label: 'Invoice History', icon: Receipt },
    { id: 'tax', label: 'Tax Settings', icon: Calculator },
    { id: 'currency', label: 'Currency Settings', icon: DollarSign },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-accent-50 dark:bg-gray-900">
        <img 
          src="/images/palm-cafe-logo.png" 
          alt="Palm Cafe Logo" 
          className="h-16 w-16 mb-4"
        />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500"></div>
        <p className="mt-4 text-secondary-600 dark:text-gray-400">Loading Palm Cafe...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-50 dark:bg-gray-900">
      <Toaster position="top-right" />
    
    {/* Header */}
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-accent-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img 
              src="/images/palm-cafe-logo.png" 
              alt="Palm Cafe Logo" 
              className="h-10 w-10 mr-3"
            />
            <h1 className="text-xl sm:text-2xl font-bold text-secondary-700 dark:text-gray-100">Palm Cafe</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* User info */}
            <div className="hidden sm:flex items-center space-x-2 text-sm text-secondary-600 dark:text-gray-400">
              <User className="h-4 w-4" />
              <span>{user?.username}</span>
            </div>
            
            {/* Dark mode toggle */}
            <DarkModeToggle />
            
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-md text-secondary-600 hover:text-secondary-700 hover:bg-accent-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-secondary-600 hover:text-secondary-700 hover:bg-accent-100"
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
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-accent-200 dark:border-gray-700 shadow-sm">
        <div className="px-4 py-2 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-secondary-500 text-white'
                    : 'text-secondary-600 hover:bg-accent-100'
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
    <nav className="hidden lg:block bg-white dark:bg-gray-800 shadow-sm border-b border-accent-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
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
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <DarkModeProvider>
          <CurrencyProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <MainApp />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CurrencyProvider>
        </DarkModeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 