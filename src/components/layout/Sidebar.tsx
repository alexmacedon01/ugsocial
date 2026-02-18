'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/types/database';
import {
  LayoutDashboard,
  FileText,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  Video,
  Briefcase,
  BarChart3,
  Brain,
  CheckCircle,
  Upload,
  Star,
  Package,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: Record<UserRole, NavItem[]> = {
  admin: [
    { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={20} /> },
    { label: 'Projekte', href: '/admin/projects', icon: <Briefcase size={20} /> },
    { label: 'Kunden', href: '/admin/clients', icon: <Users size={20} /> },
    { label: 'Creator', href: '/admin/creators', icon: <Star size={20} /> },
    { label: 'AI Scripts', href: '/admin/scripts', icon: <Brain size={20} /> },
    { label: 'Qualitätsprüfung', href: '/admin/review', icon: <CheckCircle size={20} /> },
    { label: 'Nachrichten', href: '/admin/messages', icon: <MessageSquare size={20} /> },
    { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 size={20} /> },
    { label: 'Einstellungen', href: '/admin/settings', icon: <Settings size={20} /> },
  ],
  client: [
    { label: 'Dashboard', href: '/client', icon: <LayoutDashboard size={20} /> },
    { label: 'Neues Projekt', href: '/client/brief/new', icon: <FileText size={20} /> },
    { label: 'Meine Projekte', href: '/client/projects', icon: <Briefcase size={20} /> },
    { label: 'Produkte', href: '/client/products', icon: <Package size={20} /> },
    { label: 'Videos', href: '/client/videos', icon: <Video size={20} /> },
    { label: 'Nachrichten', href: '/client/messages', icon: <MessageSquare size={20} /> },
    { label: 'Einstellungen', href: '/client/settings', icon: <Settings size={20} /> },
  ],
  creator: [
    { label: 'Dashboard', href: '/creator', icon: <LayoutDashboard size={20} /> },
    { label: 'Meine Aufträge', href: '/creator/assignments', icon: <Briefcase size={20} /> },
    { label: 'Scripts', href: '/creator/scripts', icon: <FileText size={20} /> },
    { label: 'Uploads', href: '/creator/uploads', icon: <Upload size={20} /> },
    { label: 'Nachrichten', href: '/creator/messages', icon: <MessageSquare size={20} /> },
    { label: 'Profil', href: '/creator/profile', icon: <Settings size={20} /> },
  ],
};

interface SidebarProps {
  role: UserRole;
  userName: string;
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const items = navItems[role];

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="glass-panel-heavy flex h-screen w-64 flex-col rounded-none border-r-0">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <Link href={`/${role}`} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white shadow-sm">
            UF
          </div>
          <span className="text-lg font-semibold text-text-primary">UGC Flow</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/20 text-text-primary shadow-sm backdrop-blur-sm'
                      : 'text-text-secondary hover:bg-white/10 hover:text-text-primary'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center justify-between rounded-xl px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">{userName}</p>
            <p className="text-xs capitalize text-text-tertiary">{role}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-white/15 hover:text-text-primary"
            title="Abmelden"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
