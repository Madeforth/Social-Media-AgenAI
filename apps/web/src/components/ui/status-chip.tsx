import type { PostStatus } from '@apex/types';
import { POST_STATUS_PRESENTATION } from '@apex/ui';

import { cn } from '@/lib/cn';

interface StatusChipProps {
  status: PostStatus;
  label: string;
  className?: string;
}

export function StatusChip({ status, label, className }: StatusChipProps) {
  const { tint, surface } = POST_STATUS_PRESENTATION[status];
  const animate = status === 'GENERATING' || status === 'PUBLISHING';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
        className,
      )}
      style={{ color: tint, backgroundColor: surface }}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', animate && 'animate-pulse')}
        style={{ backgroundColor: tint }}
      />
      {label}
    </span>
  );
}
