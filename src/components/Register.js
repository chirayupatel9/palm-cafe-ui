import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-accent-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <img 
              src="/images/palm-cafe-logo.png" 
              alt="Palm Cafe Logo" 
              className="h-16 w-16"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-700 dark:text-gray-100">
            Admin Registration
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600 dark:text-gray-400">
            Admin registration is now restricted
          </p>
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="text-center">
              <div className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                ⚠️ Registration Restricted
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                New admin accounts can only be created by existing admins.
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Please contact an existing admin to create your account.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 