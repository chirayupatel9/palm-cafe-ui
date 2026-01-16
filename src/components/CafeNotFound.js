import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

const CafeNotFound = ({ slug }) => {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
            <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Cafe Not Found
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          The cafe with slug <span className="font-mono font-semibold text-gray-900 dark:text-white">"{slug}"</span> could not be found.
        </p>
        
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
          Please check the URL and try again.
        </p>
        
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          <Home className="h-4 w-4 mr-2" />
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default CafeNotFound;
