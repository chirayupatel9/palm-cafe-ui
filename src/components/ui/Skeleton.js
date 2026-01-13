import React from 'react';

/**
 * Skeleton Loader Component
 * Provides placeholder content while data is loading
 */
const Skeleton = ({ 
  variant = 'text', 
  width, 
  height, 
  className = '',
  lines = 1,
  rounded = true
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';
  const roundedClass = rounded ? 'rounded' : '';
  
  if (variant === 'text') {
    if (lines > 1) {
      return (
        <div className={`space-y-2 ${className}`}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={`${baseClasses} ${roundedClass} h-4`}
              style={{ width: i === lines - 1 ? '75%' : width || '100%' }}
            />
          ))}
        </div>
      );
    }
    return (
      <div
        className={`${baseClasses} ${roundedClass} h-4 ${className}`}
        style={{ width: width || '100%' }}
      />
    );
  }
  
  if (variant === 'circle') {
    return (
      <div
        className={`${baseClasses} rounded-full ${className}`}
        style={{ width: width || height || '40px', height: height || width || '40px' }}
      />
    );
  }
  
  if (variant === 'rect') {
    return (
      <div
        className={`${baseClasses} ${roundedClass} ${className}`}
        style={{ width: width || '100%', height: height || '100px' }}
      />
    );
  }
  
  if (variant === 'table-row') {
    return (
      <tr className="animate-pulse">
        <td className="px-6 py-4">
          <div className={`${baseClasses} h-4 w-3/4 rounded`} />
        </td>
        <td className="px-6 py-4">
          <div className={`${baseClasses} h-4 w-1/2 rounded`} />
        </td>
        <td className="px-6 py-4">
          <div className={`${baseClasses} h-4 w-1/3 rounded`} />
        </td>
        <td className="px-6 py-4">
          <div className={`${baseClasses} h-4 w-1/4 rounded`} />
        </td>
      </tr>
    );
  }
  
  return null;
};

/**
 * Table Skeleton Loader
 * Shows skeleton rows for table loading state
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="h-14">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="px-6 py-4">
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 rounded" 
                   style={{ width: j === 0 ? '75%' : j === columns - 1 ? '50%' : '60%' }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};

/**
 * Card Skeleton Loader
 * Shows skeleton content for card loading state
 */
export const CardSkeleton = ({ lines = 3 }) => {
  return (
    <div className="card">
      <div className="space-y-4">
        <Skeleton variant="text" width="60%" height="24px" />
        <Skeleton variant="text" lines={lines} />
        <div className="flex space-x-2">
          <Skeleton variant="rect" width="100px" height="40px" />
          <Skeleton variant="rect" width="100px" height="40px" />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
