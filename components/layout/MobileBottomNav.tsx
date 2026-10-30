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

  const isMinistere = ["INTERCESSOR", "PRAYER_LEADER", "LEADER", "ADMIN"].includes(userRole);
  const isLeader = ["LEADER", "ADMIN"].includes(userRole);

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Home,
      show: true,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/mobile/prayer-house",
      label: "Maison de prière",
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
    {
      href: "/dashboard/mobile/leader",
      label: "Leader",
      icon: LayoutDashboard,
      show: isLeader,
      active: pathname.startsWith("/dashboard/mobile/leader"),
    },
    {
      href: "/dashboard/mobile/espace",
      label: "Toi",
      icon: User,
      show: true,
      active: pathname.startsWith("/dashboard/mobile/espace"),
    },
  ].filter((item) => item.show);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg z-50 transition-none"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-xl transition-all duration-200 flex-1 min-w-0",
                item.active
                  ? "text-indigo-600"
                  : "text-gray-500 hover:text-indigo-500"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all",
                  item.active ? "bg-indigo-50" : ""
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
              </div>
              <span className="text-[9px] font-medium truncate w-full text-center leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
