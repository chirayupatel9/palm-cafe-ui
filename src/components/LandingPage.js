import React from 'react';
import { User, Users, ArrowRight, Coffee } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src="/images/palm-cafe-logo.png" 
              alt="Palm Cafe Logo" 
              className="h-24 w-24"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-secondary-700 dark:text-secondary-300 mb-4">
            Welcome to Palm Cafe
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose your experience - order delicious food as a customer or manage operations as an admin
          </p>
        </div>

        {/* Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Customer Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mx-auto mb-6">
                <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
                I'm a Customer
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                Browse our delicious menu, place orders, and earn loyalty points with every purchase.
              </p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Coffee className="h-4 w-4 mr-3 text-green-500" />
                  Browse menu by categories
                </li>
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Coffee className="h-4 w-4 mr-3 text-green-500" />
                  Easy cart management
                </li>
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Coffee className="h-4 w-4 mr-3 text-green-500" />
                  Multiple payment options
                </li>
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Coffee className="h-4 w-4 mr-3 text-green-500" />
                  Earn loyalty points
                </li>
              </ul>
              
              <Link
                to="/customer"
                className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors group"
              >
                Start Ordering
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Admin Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-secondary-100 dark:bg-secondary-900 rounded-full mx-auto mb-6">
                <User className="h-8 w-8 text-secondary-600 dark:text-secondary-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
                I'm an Admin
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                Manage menu, orders, customers, and business operations with full control.
              </p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Coffee className="h-4 w-4 mr-3 text-secondary-500" />
                  Menu management
                </li>
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Coffee className="h-4 w-4 mr-3 text-secondary-500" />
                  Order tracking
                </li>
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Coffee className="h-4 w-4 mr-3 text-secondary-500" />
                  Customer management
                </li>
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Coffee className="h-4 w-4 mr-3 text-secondary-500" />
                  Business analytics
                </li>
              </ul>
              
              <Link
                to="/login"
                className="w-full flex items-center justify-center px-6 py-3 bg-secondary-600 text-white font-medium rounded-lg hover:bg-secondary-700 transition-colors group"
              >
                Admin Login
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2024 Palm Cafe. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 