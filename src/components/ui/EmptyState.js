import React from 'react';
import { Plus, Search, Package, Users, ShoppingCart, FileText, Settings } from 'lucide-react';

/**
 * Empty State Component
 * Displays friendly empty states with clear messaging and actions
 */
const EmptyState = ({ 
  icon: Icon = Package,
  title,
  description,
  action,
  actionLabel,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
        <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6">
          {description}
        </p>
      )}
      {action && actionLabel && (
        <button
          onClick={action}
          className="btn-primary flex items-center justify-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

/**
 * Predefined Empty States
 */
export const EmptyCustomers = ({ onAdd }) => (
  <EmptyState
    icon={Users}
    title="No customers yet"
    description="Add your first customer to start tracking orders and loyalty points."
    action={onAdd}
    actionLabel="Add First Customer"
  />
);

export const EmptyMenu = ({ onAdd }) => (
  <EmptyState
    icon={Package}
    title="No menu items yet"
    description="Create your first menu item to start taking orders."
    action={onAdd}
    actionLabel="Add First Item"
  />
);

export const EmptyOrders = ({ onNewOrder }) => (
  <EmptyState
    icon={ShoppingCart}
    title="No orders yet"
    description="Start taking orders to see them appear here."
    action={onNewOrder}
    actionLabel="Create First Order"
  />
);

export const EmptyInvoices = () => (
  <EmptyState
    icon={FileText}
    title="No invoices yet"
    description="Generate your first invoice to see it here."
  />
);

export const EmptySearch = ({ query }) => (
  <EmptyState
    icon={Search}
    title={`No results for "${query}"`}
    description="Try adjusting your search terms or filters."
  />
);

export const EmptySettings = () => (
  <EmptyState
    icon={Settings}
    title="No settings available"
    description="Settings will appear here when available."
  />
);

export default EmptyState;
