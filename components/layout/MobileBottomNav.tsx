"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Church,
  CalendarRange,
  LayoutDashboard,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  userRole: string;
}

export function MobileBottomNav({ userRole }: MobileBottomNavProps) {
  const pathname = usePathname();
  const isLeader = ["LEADER", "ADMIN"].includes(userRole);

  const navItems = [
    {
      href: "/dashboard",
      label: "Accueil",
      icon: Home,
      show: true,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/mobile/prayer-house",
      label: "Maison",
      icon: Church,
      show: true,
      active: pathname.startsWith("/dashboard/mobile/prayer-house"),
    },
    {
      href: "/dashboard/mobile/planning",
      label: "Planning",
      icon: CalendarRange,
      show: true,
      active: pathname.startsWith("/dashboard/mobile/planning"),
    },
    ...(isLeader
      ? [
          {
            href: "/dashboard/mobile/leader",
            label: "Leader",
            icon: LayoutDashboard,
            show: true,
            active: pathname.startsWith("/dashboard/mobile/leader"),
          },
        ]
      : []),
    {
      href: "/dashboard/mobile/espace",
      label: "Toi",
      icon: User,
      show: true,
      active: pathname.startsWith("/dashboard/mobile/espace"),
    },
  ];

  return (
    <div
      className="md:hidden fixed bottom-2.5 inset-x-3.5 z-50 pointer-events-none flex justify-center"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <nav className="pointer-events-auto w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.12)] rounded-2xl px-1.5 py-1.5 transition-all">
        <div className="flex items-center justify-around gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 flex-1 min-w-0 active:scale-95",
                  isActive
                    ? "text-indigo-600 font-bold"
                    : "text-slate-400 hover:text-slate-600 font-medium"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center h-8 w-11 rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105"
                      : "text-slate-500 hover:bg-slate-100/80"
                  )}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                </div>
                <span
                  className={cn(
                    "text-[10px] tracking-tight truncate w-full text-center leading-none mt-1 transition-colors",
                    isActive ? "text-indigo-600 font-bold" : "text-slate-500"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
