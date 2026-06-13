"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Shield,
  Hotel,
  Building2,
  DoorOpen,
  Home,
  BarChart3,
  MessageSquare,
  CalendarDays,
  UserCheck,
  X,
  GraduationCap,
  CreditCard,
  Eye,
  LucideIcon,
} from "lucide-react";
import { Role } from "@/lib/types";

interface SidebarLink {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
}

interface SidebarSection {
  title: string;
  links: SidebarLink[];
}

const sidebarSections: SidebarSection[] = [
  {
    title: "Main Menu",
    links: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN, Role.STAFF, Role.STUDENT] },
    ],
  },
  {
    title: "Management",
    links: [
      { href: "/admin/students", label: "Students", icon: Users, roles: [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN, Role.STAFF] },
      { href: "/admin/hostels", label: "Hostels", icon: Hotel, roles: [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN, Role.STAFF] },
      { href: "/admin/rooms", label: "Rooms", icon: Building2, roles: [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN, Role.STAFF] },
      { href: "/admin/payments", label: "Fee Management", icon: CreditCard, roles: [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN] },
      { href: "/admin/users", label: "Users", icon: Shield, roles: [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN] },
    ],
  },
  {
    title: "Operations",
    links: [
      { href: "/admin/room-allocations", label: "Allocations", icon: DoorOpen, roles: [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN] },
      { href: "/admin/room-visualization", label: "Room View", icon: Eye, roles: [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN, Role.STAFF] },
      { href: "/admin/complaints", label: "Complaints", icon: MessageSquare, roles: [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN, Role.STAFF] },
      { href: "/admin/leave-requests", label: "Leave Requests", icon: CalendarDays, roles: [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN, Role.STAFF] },
    ],
  },
  {
    title: "Visitors",
    links: [
      { href: "/admin/visitors", label: "Visitors", icon: UserCheck, roles: [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN, Role.STAFF] },
      { href: "/admin/visitors/requests", label: "Requests", icon: ClipboardList, roles: [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN, Role.STAFF] },
      { href: "/admin/visitors/logs", label: "Logs", icon: Users, roles: [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN, Role.STAFF] },
      { href: "/admin/visitors/analytics", label: "Analytics", icon: BarChart3, roles: [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN] },
    ],
  },
  {
    title: "System",
    links: [
      { href: "/admin/reports", label: "Reports", icon: BarChart3, roles: [Role.SUPER_ADMIN, Role.HOSTEL_ADMIN, Role.STAFF] },
      { href: "/audit-logs", label: "Audit Logs", icon: ClipboardList, roles: [Role.SUPER_ADMIN] },
    ],
  },
  {
    title: "Student",
    links: [
      { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: [Role.STUDENT] },
      { href: "/student/my-room", label: "My Room", icon: Home, roles: [Role.STUDENT] },
      { href: "/student/complaints", label: "Complaints", icon: MessageSquare, roles: [Role.STUDENT] },
      { href: "/student/leave-requests", label: "Leave Requests", icon: CalendarDays, roles: [Role.STUDENT] },
      { href: "/student/visitors", label: "Visitors", icon: UserCheck, roles: [Role.STUDENT] },
      { href: "/student/visitors/gate-passes", label: "Gate Passes", icon: ClipboardList, roles: [Role.STUDENT] },
    ],
  },
  {
    title: "Hostel Admin",
    links: [
      { href: "/hostel-admin/dashboard", label: "Dashboard", icon: Hotel, roles: [Role.HOSTEL_ADMIN] },
    ],
  },
  {
    title: "Staff",
    links: [
      { href: "/staff/dashboard", label: "Dashboard", icon: Building2, roles: [Role.STAFF] },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role as Role | undefined;

  if (!userRole) return null;

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 shadow-elevated lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg font-heading">HostelMS</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
          {sidebarSections.map((section) => {
            const visibleLinks = section.links.filter((link) =>
              link.roles.includes(userRole)
            );
            if (visibleLinks.length === 0) return null;

            return (
              <div key={section.title}>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-2">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {visibleLinks.map((link) => {
                    const active = isActive(link.href);
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group",
                          active
                            ? "text-primary bg-primary/10 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:rounded-r-full before:bg-gradient-primary"
                            : "text-muted-foreground/80 hover:text-foreground hover:bg-sidebar-accent"
                        )}
                      >
                        <Icon className={cn(
                          "h-4 w-4 transition-all duration-200",
                          active && "text-primary"
                        )} />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="rounded-lg bg-gradient-primary/10 p-3 text-center">
            <p className="text-xs font-medium text-primary">HostelMS v1.0</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Management System</p>
          </div>
        </div>
      </aside>
    </>
  );
}
