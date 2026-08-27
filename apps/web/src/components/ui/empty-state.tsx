import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon ? (
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-border-subtle bg-surface-raised text-text-muted">
          {icon}
        </span>
      ) : null}
      <p className="text-sm font-medium text-text-primary">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm text-text-secondary">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
