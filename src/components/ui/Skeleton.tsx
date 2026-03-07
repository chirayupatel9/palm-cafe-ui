import React from 'react';

export interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect' | 'table-row';
  width?: string | number;
  height?: string | number;
  className?: string;
  lines?: number;
  rounded?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
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
              style={{ width: i === lines - 1 ? '75%' : (width as string) || '100%' }}
            />
          ))}
        </div>
      );
    }
    return (
      <div
        className={`${baseClasses} ${roundedClass} h-4 ${className}`}
        style={{ width: (width as string) || '100%' }}
      />
    );
  }

  if (variant === 'circle') {
    return (
      <div
        className={`${baseClasses} rounded-full ${className}`}
        style={{
          width: (width as string) || (height as string) || '40px',
          height: (height as string) || (width as string) || '40px'
        }}
      />
    );
  }

  if (variant === 'rect') {
    return (
      <div
        className={`${baseClasses} ${roundedClass} ${className}`}
        style={{ width: (width as string) || '100%', height: (height as string) || '100px' }}
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

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 4 }) => {
  return (
    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="h-14">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="px-6 py-4">
              <div
                className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 rounded"
                style={{
                  width: j === 0 ? '75%' : j === columns - 1 ? '50%' : '60%'
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};

export interface CardSkeletonProps {
  lines?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ lines = 3 }) => {
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
