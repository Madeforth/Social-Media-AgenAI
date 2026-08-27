'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ApexMarkIcon, ChevronRightIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { isNavItemActive, PRIMARY_NAV, SECONDARY_NAV, type NavItem } from '@/lib/nav';

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150',
        active
          ? 'bg-accent-soft text-accent'
          : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary',
      )}
    >
      <Icon className="h-4.5 w-4.5 shrink-0" />
      {item.label}
    </Link>
  );
}

interface SidebarProps {
  /** Null until a brand exists in the database. */
  brandName: string | null;
}

export function Sidebar({ brandName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border-subtle bg-surface lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <ApexMarkIcon className="h-6 w-6 text-accent" />
        <span className="text-sm font-semibold tracking-wide text-text-primary">
          APEX SOCIAL AI
        </span>
      </div>

      <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 px-3">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} active={isNavItemActive(pathname, item.href)} />
        ))}
        <div className="mt-auto flex flex-col gap-1 pb-3">
          {SECONDARY_NAV.map((item) => (
            <NavLink key={item.href} item={item} active={isNavItemActive(pathname, item.href)} />
          ))}
        </div>
      </nav>

      <div className="border-t border-border-subtle p-3">
        <Link
          href="/settings"
          className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors duration-150 hover:bg-surface-raised"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-soft text-accent">
            <ApexMarkIcon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-text-primary">
              {brandName ?? 'No brand yet'}
            </span>
            <span className="block text-xs text-text-muted">
              {brandName ? 'Change brand' : 'Create one in Settings'}
            </span>
          </span>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-text-muted" />
        </Link>
      </div>
    </aside>
  );
}
