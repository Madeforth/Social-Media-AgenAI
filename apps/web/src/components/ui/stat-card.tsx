import type { ReactNode } from 'react';

import { Card } from './card';

interface StatCardProps {
  label: string;
  value: number;
  unit: string;
  icon: ReactNode;
  tint: string;
}

export function StatCard({ label, value, unit, icon, tint }: StatCardProps) {
  return (
    <Card className="flex items-start justify-between gap-4 p-5">
      <div>
        <p className="text-xs font-medium text-text-secondary">{label}</p>
        <p className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight text-text-primary">{value}</span>
          <span className="text-xs text-text-muted">{unit}</span>
        </p>
      </div>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
        style={{ color: tint, backgroundColor: `${tint}1f` }}
      >
        {icon}
      </span>
    </Card>
  );
}
