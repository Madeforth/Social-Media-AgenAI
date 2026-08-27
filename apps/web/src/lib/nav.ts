import type { ComponentType, SVGProps } from 'react';

import {
  AnalyticsIcon,
  AssetsIcon,
  BrainIcon,
  CalendarIcon,
  DashboardIcon,
  InboxIcon,
  LibraryIcon,
  SettingsIcon,
  SparkIcon,
} from '@/components/icons';

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/** Primary workspace navigation, in the order defined by CLAUDE.md. */
export const PRIMARY_NAV: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: DashboardIcon },
  { href: '/create', label: 'Create with AI', icon: SparkIcon },
  { href: '/calendar', label: 'Calendar', icon: CalendarIcon },
  { href: '/library', label: 'Content Library', icon: LibraryIcon },
  { href: '/brand-brain', label: 'Brand Brain', icon: BrainIcon },
  { href: '/assets', label: 'Assets', icon: AssetsIcon },
  { href: '/analytics', label: 'Analytics', icon: AnalyticsIcon },
  { href: '/inbox', label: 'Inbox', icon: InboxIcon },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
