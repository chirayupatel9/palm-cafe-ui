import React from 'react';
import { Loader, LucideIcon } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants: Record<string, string> = {
    primary:
      'bg-primary hover:bg-[var(--color-primary-dark)] text-white focus:ring-primary shadow-sm hover:shadow-md',
    secondary:
      'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-500',
    destructive:
      'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm hover:shadow-md',
    ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500'
  };
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12'
  };
  const widthClass = fullWidth ? 'w-full' : '';
  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`;

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? (
        <>
          <Loader className="h-4 w-4 animate-spin mr-2" />
          {children}
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="h-4 w-4 mr-2" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="h-4 w-4 ml-2" />}
        </>
      )}
    </button>
  );
};

export default Button;
