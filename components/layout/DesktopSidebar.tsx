"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Church, CalendarRange, HeartPulse,
  CalendarCheck, LayoutDashboard, User,
  Activity, Settings, ChevronRight, Cross,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DesktopSidebarProps {
  userRole: string;
  userName: string;
  userImage?: string | null;
}

const NAV_SECTIONS = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Home, exact: true, show: () => true },
      { href: "/dashboard/desktop/planning", label: "Planning", icon: CalendarRange, exact: false, show: () => true },
      { href: "/dashboard/desktop/prayer-house", label: "Maison de Prière", icon: Church, exact: false, show: () => true },
    ],
  },
  {
    label: "Bien-être",
    items: [
      { href: "/dashboard/desktop/checkin", label: "Mon Check-in", icon: HeartPulse, exact: false, show: () => true },
      { href: "/dashboard/desktop/rdv", label: "Rendez-vous", icon: CalendarCheck, exact: false, show: () => true },
    ],
  },
  {
    label: "Mon Espace",
    items: [
      { href: "/dashboard/desktop/espace", label: "Mon Espace", icon: User, exact: false, show: () => true },
    ],
  },
];

const LEADER_ITEMS = [
  { href: "/dashboard/desktop/leader/checkins", label: "Suivi des Stars", icon: Activity },
  { href: "/dashboard/desktop/leader/rdv", label: "Mes Rendez-vous", icon: CalendarCheck },
  { href: "/dashboard/leader/prayer", label: "Mur de Prières", icon: LayoutDashboard },
  { href: "/dashboard/leader/planning", label: "Planification", icon: CalendarRange },
  { href: "/dashboard/leader/team", label: "Équipe", icon: User },
];

export function DesktopSidebar({ userRole, userName, userImage }: DesktopSidebarProps) {
  const pathname = usePathname();
  const isLeader = ["LEADER", "ADMIN"].includes(userRole);

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-gray-100 min-h-screen sticky top-0 z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Prayer ICC</p>
            <p className="text-[10px] text-gray-400">Espace membres</p>
          </div>
        </div>
      </div>

      {/* User card */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
          <div className="relative shrink-0">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-sm">
                {userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white block" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-800 truncate">{userName.split(" ")[0]}</p>
            <p className="text-[10px] text-gray-400 capitalize">{userRole.toLowerCase().replace("_", " ")}</p>
          </div>
          <Link href="/dashboard/user/profile" className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-indigo-500">
            <Settings className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                      active
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-indigo-700"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-gray-400 group-hover:text-indigo-500")} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {active && <ChevronRight className="h-3 w-3 text-white/60 shrink-0" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Section Leader */}
        {isLeader && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">
              Espace Leader
            </p>
            <div className="space-y-0.5">
              {LEADER_ITEMS.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                      active
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-violet-50 hover:text-violet-700"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-gray-400 group-hover:text-violet-500")} />
                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-[10px] text-gray-300 text-center">Prayer ICC · {new Date().getFullYear()}</p>
      </div>
    </aside>
  );
}
