import React from 'react';

/**
 * Standardized Table Component
 * 
 * Features:
 * - Consistent row height (56px)
 * - Clear headers
 * - Subtle dividers
 * - Responsive design
 */
const Table = ({
  columns,
  data,
  renderRow,
  emptyMessage = 'No data available',
  className = ''
}) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key || index}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                  column.align === 'right' ? 'text-right' : ''
                }`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors h-14"
              >
                {renderRow(row, rowIndex)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
