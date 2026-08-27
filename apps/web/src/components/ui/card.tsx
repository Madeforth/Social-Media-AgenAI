import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a hover lift. Only use on cards that are actually clickable. */
  interactive?: boolean;
}

export function Card({ interactive = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border-subtle bg-surface',
        interactive &&
          'transition-colors duration-150 hover:border-border-strong hover:bg-surface-raised',
        className,
      )}
      {...props}
    />
  );
}

interface CardHeaderProps {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4 px-5 py-4', className)}>
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      {action}
    </div>
  );
}

export function CardDivider() {
  return <div className="h-px bg-border-subtle" />;
}
