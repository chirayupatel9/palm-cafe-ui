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
    description="Customer profiles help you track orders, manage loyalty points, and build relationships. Add your first customer to get started."
    action={onAdd}
    actionLabel="Add Customer"
  />
);

export const EmptyMenu = ({ onAdd }) => (
  <EmptyState
    icon={Package}
    title="Your menu is empty"
    description="Menu items will appear here once you add them. Start by adding your most popular items to begin taking orders."
    action={onAdd}
    actionLabel="Add Menu Item"
  />
);

export const EmptyOrders = ({ onNewOrder }) => (
  <EmptyState
    icon={ShoppingCart}
    title="No orders yet"
    description="Orders will appear here as you start taking them. Create your first order to begin tracking sales and customer activity."
    action={onNewOrder}
    actionLabel="New Order"
  />
);

export const EmptyInvoices = () => (
  <EmptyState
    icon={FileText}
    title="No invoices yet"
    description="Invoices are automatically generated when orders are completed. Completed orders will appear here with their invoice details."
  />
);

export const EmptySearch = ({ query }) => (
  <EmptyState
    icon={Search}
    title={`No results for "${query}"`}
    description="We couldn't find anything matching your search. Try different keywords or clear your filters to see all items."
  />
);

export const EmptySettings = () => (
  <EmptyState
    icon={Settings}
    title="Settings"
    description="Configure your cafe preferences, branding, and system options from the settings menu."
  />
);

export default EmptyState;
