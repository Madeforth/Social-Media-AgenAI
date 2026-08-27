import type { ComponentType, SVGProps } from 'react';

import type { Dictionary } from '@/i18n/dictionary';
import { hasLocale } from '@/i18n/config';
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
  labelKey: keyof Dictionary['nav'];
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/** Primary workspace navigation, in the order defined by CLAUDE.md. */
export const PRIMARY_NAV: NavItem[] = [
  { href: '/', labelKey: 'dashboard', icon: DashboardIcon },
  { href: '/create', labelKey: 'createWithAi', icon: SparkIcon },
  { href: '/calendar', labelKey: 'calendar', icon: CalendarIcon },
  { href: '/library', labelKey: 'contentLibrary', icon: LibraryIcon },
  { href: '/brand-brain', labelKey: 'brandBrain', icon: BrainIcon },
  { href: '/assets', labelKey: 'assets', icon: AssetsIcon },
  { href: '/analytics', labelKey: 'analytics', icon: AnalyticsIcon },
  { href: '/inbox', labelKey: 'inbox', icon: InboxIcon },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: '/settings', labelKey: 'settings', icon: SettingsIcon },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  const [, firstSegment, ...rest] = pathname.split('/');
  const localPathname = firstSegment && hasLocale(firstSegment) ? `/${rest.join('/')}` : pathname;
  if (href === '/') return localPathname === '/' || localPathname === '';
  return localPathname === href || localPathname.startsWith(`${href}/`);
}
