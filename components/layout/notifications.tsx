"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area"; 
import { getUserNotifications, markAsRead, markAllAsRead } from "@/app/actions/notifications";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/hooks/useRealRime";

function resolveNotificationLink(notif: { title?: string; message?: string; link?: string }): string {
  if (notif.link && notif.link !== "/" && notif.link !== "/dashboard" && notif.link !== "/dashboard/") {
    return notif.link;
  }
  const text = `${notif.title || ""} ${notif.message || ""}`.toLowerCase();
  if (text.includes("maison") || text.includes("sentinelle") || text.includes("garde") || text.includes("nuit")) {
    return "/dashboard/desktop/prayer-house";
  }
  if (text.includes("planning") || text.includes("service") || text.includes("créneau") || text.includes("creneau") || text.includes("programme")) {
    return "/dashboard/desktop/planning";
  }
  if (text.includes("événement") || text.includes("evenement") || text.includes("spécial") || text.includes("special")) {
    return "/dashboard/user/intercessor/events";
  }
  if (text.includes("profil") || text.includes("compte") || text.includes("rôle") || text.includes("role") || text.includes("équipe") || text.includes("equipe")) {
    return "/dashboard/user/profile";
  }
  return "/dashboard";
}

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const result = useRealtime({
    queryKey: ['notifications'],
    initialData: { 
        notifications: [], 
        unreadCount: 0 
    },
    fetcher: getUserNotifications,
    refetchInterval: 10000,
  });

  const notifications = result?.notifications || [];
  const unreadCount = result?.unreadCount || 0;

  const handleNotificationClick = async (notif: any) => {
    try {
      if (!notif.isRead) {
        await markAsRead(notif.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsOpen(false);
      const destination = resolveNotificationLink(notif);
      router.push(destination);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-indigo-600 rounded-xl cursor-pointer">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-indigo-600 border-2 border-white ring-1 ring-indigo-600/20" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 shadow-xl border-slate-200/80 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg cursor-pointer"
                    onClick={() => markAllAsRead()}
                >
                    Tout marquer comme lu
                </Button>
            )}
        </div>

        <ScrollArea className="max-h-[360px] h-auto">
            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-xs">
                    <Bell className="h-6 w-6 mb-1.5 opacity-25" />
                    Aucune notification
                </div>
            ) : (
                <div className="flex flex-col p-1.5 space-y-1">
                    {notifications.map((notif: any) => (
                        <button 
                            key={notif.id}
                            type="button"
                            onClick={() => handleNotificationClick(notif)}
                            className={cn(
                                "w-full text-left flex flex-col items-start gap-1 p-3 rounded-xl transition-colors cursor-pointer border border-transparent",
                                !notif.isRead 
                                  ? "bg-indigo-50/40 hover:bg-indigo-50/70 border-indigo-100/60" 
                                  : "hover:bg-slate-50"
                            )}
                        >
                            <NotificationContent notif={notif} />
                        </button>
                    ))}
                </div>
            )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationContent({ notif }: { notif: any }) {
    return (
        <div className="w-full">
            <div className="flex justify-between items-start w-full gap-2">
                <span className={cn("text-xs font-semibold leading-snug", !notif.isRead ? "text-indigo-950 font-bold" : "text-slate-700")}>
                    {notif.title}
                </span>
                {!notif.isRead && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 mt-1 shrink-0" />}
            </div>
            {notif.message && (
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-snug">
                    {notif.message}
                </p>
            )}
            <span className="text-[10px] text-slate-400 mt-1.5 block">
                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: fr })}
            </span>
        </div>
    );
}
