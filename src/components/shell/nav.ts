import {
  LayoutDashboard, ScanLine, History, ChartNoAxesCombined, FileText,
  BookOpen, Settings, User, type LucideIcon,
} from 'lucide-react';
import type { StringKey } from '@/lib/i18n';

export interface NavItem { href: string; icon: LucideIcon; key: StringKey; exact?: boolean }
export interface NavGroup { key: StringKey; items: NavItem[] }

/** Information architecture: what you do, what you learn, who you are. */
export const NAV: NavGroup[] = [
  {
    key: 'groupWorkspace',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, key: 'navDashboard' },
      { href: '/scan', icon: ScanLine, key: 'navScanCrops' },
      { href: '/history', icon: History, key: 'navHistory' },
    ],
  },
  {
    key: 'groupIntelligence',
    items: [
      { href: '/analytics', icon: ChartNoAxesCombined, key: 'navAnalytics' },
      { href: '/reports', icon: FileText, key: 'navReports' },
      { href: '/library', icon: BookOpen, key: 'navLibrary' },
    ],
  },
  {
    key: 'groupAccount',
    items: [
      { href: '/profile', icon: User, key: 'navProfile' },
      { href: '/settings', icon: Settings, key: 'navSettings' },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV.flatMap((g) => g.items);

export const isActive = (path: string, href: string) => path === href || path.startsWith(href + '/');
