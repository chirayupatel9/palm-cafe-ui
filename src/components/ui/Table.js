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
    <div className={`overflow-x-auto ${className}`} style={{ 
      backgroundColor: 'var(--surface-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-outline)',
      boxShadow: 'var(--elevation-1)'
    }}>
      <table className="min-w-full" style={{ 
        borderCollapse: 'separate',
        borderSpacing: 0
      }}>
        <thead style={{ 
          backgroundColor: 'var(--surface-table)'
        }}>
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key || index}
                className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                  column.align === 'right' ? 'text-right' : ''
                }`}
                style={{ 
                  color: 'var(--color-on-surface-variant)',
                  borderBottom: '2px solid var(--color-outline)'
                }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ 
          backgroundColor: 'var(--surface-card)'
        }}>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center">
                <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className="transition-colors h-14"
                style={{ 
                  borderBottom: '1px solid var(--color-outline-variant)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-table)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--surface-card)';
                }}
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
