import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  BarChart3,
  FileText,
  Calendar,
  Bell,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  School,
  UserSquare2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: 'Students',
    icon: <GraduationCap className="h-4 w-4" />,
    children: [
      { label: 'All Students', href: '/students', icon: <Users className="h-4 w-4" /> },
      { label: 'Register Student', href: '/students/register', icon: <UserSquare2 className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Teachers',
    icon: <School className="h-4 w-4" />,
    children: [
      { label: 'All Teachers', href: '/teachers', icon: <Users className="h-4 w-4" /> },
      { label: 'Register Teacher', href: '/teachers/register', icon: <UserSquare2 className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Academics',
    icon: <BookOpen className="h-4 w-4" />,
    children: [
      { label: 'Classes', href: '/academics/classes', icon: <BookOpen className="h-4 w-4" /> },
      { label: 'Batches', href: '/academics/batches', icon: <BookOpen className="h-4 w-4" /> },
      { label: 'Subjects', href: '/academics/subjects', icon: <BookOpen className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Attendance',
    icon: <CalendarCheck className="h-4 w-4" />,
    children: [
      { label: 'Student Attendance', href: '/attendance/students', icon: <CalendarCheck className="h-4 w-4" /> },
      { label: 'Teacher Attendance', href: '/attendance/teachers', icon: <CalendarCheck className="h-4 w-4" /> },
      { label: 'Excel Import', href: '/attendance/import', icon: <FileText className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Results & Marks',
    icon: <ClipboardList className="h-4 w-4" />,
    children: [
      { label: 'Student Results', href: '/results/exams', icon: <ClipboardList className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Notes & Material',
    href: '/notes',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    label: 'Calendar',
    href: '/calendar',
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: <Bell className="h-4 w-4" />,
  },
  {
    label: 'Audit Logs',
    href: '/audit-logs',
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings className="h-4 w-4" />,
  },
];

function NavGroup({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const location = useLocation();
  const isChildActive = item.children?.some(
    (child) => child.href && location.pathname.startsWith(child.href)
  );

  if (item.href) {
    return (
      <NavLink
        to={item.href}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
            isActive
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )
        }
        title={collapsed ? item.label : undefined}
      >
        <span className="shrink-0">{item.icon}</span>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </NavLink>
    );
  }

  if (item.children) {
    return (
      <div>
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider',
            isChildActive
              ? 'text-sidebar-foreground'
              : 'text-sidebar-foreground/40'
          )}
          title={collapsed ? item.label : undefined}
        >
          <span className="shrink-0">{item.icon}</span>
          {!collapsed && <span className="truncate">{item.label}</span>}
        </div>
        {!collapsed && (
          <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
            {item.children.map((child) => (
              <NavLink
                key={child.href}
                to={child.href!}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-all duration-150',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )
                }
              >
                <span className="shrink-0">{child.icon}</span>
                <span className="truncate">{child.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

export function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-full z-30 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300',
        // Desktop
        collapsed ? 'w-16 lg:translate-x-0' : 'w-64 lg:translate-x-0',
        // Mobile
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <span className="text-sidebar-primary-foreground font-bold text-sm">F</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-bold text-sm truncate text-sidebar-foreground">FUNDAMICS</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">Admin Panel</p>
            </div>
          )}
        </div>

        {/* Mobile close */}
        <button
          onClick={onCloseMobile}
          className="ml-auto lg:hidden text-sidebar-foreground/50 hover:text-sidebar-foreground p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map((item, i) => (
          <NavGroup key={i} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden lg:flex items-center justify-end p-2 border-t border-sidebar-border shrink-0">
        <button
          className="p-1.5 rounded-md text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
