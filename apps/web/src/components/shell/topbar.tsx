'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ApexMarkIcon, BellIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { isNavItemActive, PRIMARY_NAV, SECONDARY_NAV } from '@/lib/nav';

const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];

export function Topbar({ brandName }: { brandName: string | null }) {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-10 border-b border-border-subtle bg-bg/85 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
        <div className="flex items-center gap-2.5 lg:hidden">
          <ApexMarkIcon className="h-5 w-5 text-accent" />
          <span className="text-sm font-semibold tracking-wide text-text-primary">
            {brandName ?? 'APEX SOCIAL AI'}
          </span>
        </div>

        {/*
          Stated plainly rather than hidden: nothing on these screens is real
          until the Supabase project exists.
        */}
        <span className="hidden rounded-full border border-border-subtle px-2.5 py-1 text-[11px] text-text-muted lg:inline-flex">
          Not connected to Supabase
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors duration-150 hover:bg-surface-raised hover:text-text-primary"
          >
            <BellIcon className="h-4.5 w-4.5" />
          </button>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border-strong bg-surface-raised text-xs font-medium text-text-secondary"
          >
            MA
          </span>
        </div>
      </div>

      <nav
        aria-label="Primary"
        className="flex gap-1 overflow-x-auto border-t border-border-subtle px-4 py-2 lg:hidden"
      >
        {ALL_NAV.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'shrink-0 rounded-md px-3 py-1.5 text-xs transition-colors duration-150',
                active
                  ? 'bg-accent-soft text-accent'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
