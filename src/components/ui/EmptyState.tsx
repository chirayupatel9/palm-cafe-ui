import React from 'react';
import { Plus, Search, Package, Users, ShoppingCart, FileText, Settings, LucideIcon } from 'lucide-react';
import { GlassButton } from './GlassButton';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: () => void;
  actionLabel?: string;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
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
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6">{description}</p>
      )}
      {action && actionLabel && (
        <GlassButton onClick={action} size="default" className="glass-button-primary" contentClassName="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {actionLabel}
        </GlassButton>
      )}
    </div>
  );
};

export interface EmptyCustomersProps {
  onAdd?: () => void;
}
export const EmptyCustomers: React.FC<EmptyCustomersProps> = ({ onAdd }) => (
  <EmptyState
    icon={Users}
    title="No customers yet"
    description="Customer profiles help you track orders, manage loyalty points, and build relationships. Add your first customer to get started."
    action={onAdd}
    actionLabel="Add Customer"
  />
);

export interface EmptyMenuProps {
  onAdd?: () => void;
}
export const EmptyMenu: React.FC<EmptyMenuProps> = ({ onAdd }) => (
  <EmptyState
    icon={Package}
    title="Your menu is empty"
    description="Menu items will appear here once you add them. Start by adding your most popular items to begin taking orders."
    action={onAdd}
    actionLabel="Add Menu Item"
  />
);

export interface EmptyOrdersProps {
  onNewOrder?: () => void;
}
export const EmptyOrders: React.FC<EmptyOrdersProps> = ({ onNewOrder }) => (
  <EmptyState
    icon={ShoppingCart}
    title="No orders yet"
    description="Orders will appear here as you start taking them. Create your first order to begin tracking sales and customer activity."
    action={onNewOrder}
    actionLabel="New Order"
  />
);

export const EmptyInvoices: React.FC = () => (
  <EmptyState
    icon={FileText}
    title="No invoices yet"
    description="Invoices are automatically generated when orders are completed. Completed orders will appear here with their invoice details."
  />
);

export interface EmptySearchProps {
  query: string;
}
export const EmptySearch: React.FC<EmptySearchProps> = ({ query }) => (
  <EmptyState
    icon={Search}
    title={`No results for "${query}"`}
    description="We couldn't find anything matching your search. Try different keywords or clear your filters to see all items."
  />
);

export const EmptySettings: React.FC = () => (
  <EmptyState
    icon={Settings}
    title="Settings"
    description="Configure your cafe preferences, branding, and system options from the settings menu."
  />
);

export default EmptyState;
