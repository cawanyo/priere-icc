"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, Check, Loader2, Smartphone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area"; 
import { getUserNotifications, markAsRead, markAllAsRead } from "@/app/actions/notifications";
import { sendTestPushNotification } from "@/app/actions/push-subscription";
import { subscribeUserToPush } from "@/components/pwa/PwaManager";
import { toast } from "sonner";
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
  const [pushStatus, setPushStatus] = useState<"granted" | "denied" | "default" | "unsupported">("default");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPushStatus("unsupported");
      return;
    }
    setPushStatus(Notification.permission);
  }, []);

  const handleEnablePush = async () => {
    setIsSubscribing(true);
    try {
      const res = await subscribeUserToPush();
      if (res.success) {
        setPushStatus("granted");
        toast.success("Notifications push activées ! Vous recevrez désormais les alertes sur cet appareil.");
      } else {
        if ("Notification" in window) {
          setPushStatus(Notification.permission);
        }
        toast.error(res.message || "Impossible d'activer les notifications");
      }
    } catch {
      toast.error("Erreur lors de l'activation des notifications.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleTestPush = async () => {
    setIsTesting(true);
    try {
      const res = await sendTestPushNotification();
      if (res.success) {
        toast.success("Notification de test envoyée ! Regardez votre écran.");
      } else {
        toast.error(res.error || "Erreur lors de l'envoi du test.");
      }
    } catch {
      toast.error("Erreur lors de l'envoi du test.");
    } finally {
      setIsTesting(false);
    }
  };

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

        {/* Bannière de statut Push Notifications */}
        <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/50 text-xs">
          {pushStatus === "granted" ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-emerald-700 min-w-0">
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="truncate text-[11px] font-medium">Alertes smartphone actives</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestPush}
                disabled={isTesting}
                className="h-6 text-[11px] px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 shrink-0 rounded-lg cursor-pointer"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Envoi...
                  </>
                ) : (
                  "Tester"
                )}
              </Button>
            </div>
          ) : pushStatus === "denied" ? (
            <div className="flex items-start gap-1.5 text-[11px] text-amber-800">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600 mt-0.5" />
              <span>Notifications bloquées dans les paramètres du navigateur.</span>
            </div>
          ) : pushStatus === "default" ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-slate-700 min-w-0">
                <Smartphone className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                <span className="truncate text-[11px]">Recevoir les alertes sur écran</span>
              </div>
              <Button
                size="sm"
                onClick={handleEnablePush}
                disabled={isSubscribing}
                className="h-6 text-[11px] px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 font-semibold rounded-lg shadow-xs cursor-pointer"
              >
                {isSubscribing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Activation...
                  </>
                ) : (
                  <>
                    <BellRing className="h-3 w-3 mr-1" />
                    Activer
                  </>
                )}
              </Button>
            </div>
          ) : null}
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
