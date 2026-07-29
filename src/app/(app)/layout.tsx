import { AppShell } from '@/components/shell/AppShell';

/** Every authenticated route renders inside the sidebar + topbar shell. */
export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
