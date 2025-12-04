"use client";

import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area"; 
import { getUserNotifications, markAsRead, markAllAsRead } from "@/app/actions/notifications";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/hooks/useRealRime";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);

  const result = useRealtime({
    queryKey: ['notifications'],
    
    initialData: { 
        notifications: [], 
        unreadCount: 0 
    },
    // ----------------------
    
    fetcher: getUserNotifications,
    refetchInterval: 10000,
  });

  const notifications = result?.notifications || [];
  console.log(result)
  const unreadCount = result?.unreadCount || 0;

  const handleRead = async (id: string, link?: string) => {
    await markAsRead(id);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-indigo-600">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-white" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto px-2 text-xs text-indigo-600 hover:text-indigo-700"
                    onClick={() => markAllAsRead()}
                >
                    Tout marquer comme lu
                </Button>
            )}
        </div>

        <ScrollArea className="h-[300px]">
            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm">
                    <Bell className="h-8 w-8 mb-2 opacity-20" />
                    Aucune notification
                </div>
            ) : (
                <div className="flex flex-col">
                    {notifications.map((notif: any) => (
                        <DropdownMenuItem 
                            key={notif.id}
                            className={cn(
                                "flex flex-col items-start gap-1 p-4 cursor-pointer border-b border-gray-50 focus:bg-gray-50",
                                !notif.isRead ? "bg-indigo-50/30" : "bg-white"
                            )}
                            onSelect={() => handleRead(notif.id)}
                            asChild
                        >
                            {notif.link ? (
                                <Link href={notif.link}>
                                    <NotificationContent notif={notif} />
                                </Link>
                            ) : (
                                <div onClick={() => handleRead(notif.id)}>
                                    <NotificationContent notif={notif} />
                                </div>
                            )}
                        </DropdownMenuItem>
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
            <div className="flex justify-between items-start w-full">
                <span className={cn("text-sm font-medium", !notif.isRead ? "text-indigo-900" : "text-gray-700")}>
                    {notif.title}
                </span>
                {!notif.isRead && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 mt-1.5" />}
            </div>
            {notif.message && (
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-snug">
                    {notif.message}
                </p>
            )}
            <span className="text-[10px] text-gray-400 mt-2 block">
                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: fr })}
            </span>
        </div>
    )
}