import { Sidebar } from './Sidebar';
import type { UserRole } from '@/types/database';

interface DashboardShellProps {
  children: React.ReactNode;
  role: UserRole;
  userName: string;
}

export function DashboardShell({ children, role, userName }: DashboardShellProps) {
  return (
    <div className="bg-mesh-gradient flex h-screen overflow-hidden">
      <Sidebar role={role} userName={userName} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
