import React from 'react';
import { Plus, LucideIcon } from 'lucide-react';
import { GlassButton } from './ui/GlassButton';

export interface PageHeaderAction {
  onClick: () => void;
  label: string;
  icon?: LucideIcon;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  primaryAction?: () => void;
  primaryActionLabel?: string;
  primaryActionIcon?: LucideIcon;
  secondaryActions?: PageHeaderAction[];
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  primaryAction,
  primaryActionLabel,
  primaryActionIcon: PrimaryActionIcon = Plus,
  secondaryActions = [],
  children
}) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <Icon className="h-6 w-6 text-[var(--color-primary)]" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[var(--color-on-surface)] truncate">{title}</h1>
            {description && (
              <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">{description}</p>
            )}
          </div>
        </div>

        {primaryAction && primaryActionLabel && (
          <div className="flex items-center gap-3 shrink-0">
            {secondaryActions.map((action, index) => {
              const ActionIcon = action.icon;
              return (
                <GlassButton
                  key={index}
                  onClick={action.onClick}
                  size="default"
                  className="glass-button-secondary"
                  contentClassName={ActionIcon ? 'flex items-center gap-2' : undefined}
                >
                  {ActionIcon && <ActionIcon className="h-4 w-4" />}
                  {action.label}
                </GlassButton>
              );
            })}
            <GlassButton
              onClick={primaryAction}
              size="default"
              className="glass-button-primary"
              contentClassName="flex items-center gap-2"
            >
              <PrimaryActionIcon className="h-4 w-4" />
              {primaryActionLabel}
            </GlassButton>
          </div>
        )}
      </div>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
};

export default PageHeader;
