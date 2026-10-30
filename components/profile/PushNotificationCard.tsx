"use client";

import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, AlertCircle, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { subscribeUserToPush } from "@/components/pwa/PwaManager";
import { sendTestPushNotification } from "@/app/actions/push-subscription";

export function PushNotificationCard() {
  const [permission, setPermission] = useState<"granted" | "denied" | "default" | "unsupported">("default");
  const [isActivating, setIsActivating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    const current = Notification.permission;
    setPermission(current);

    // Synchronisation automatique et transparente si la permission est déjà accordée
    if (current === "granted") {
      subscribeUserToPush().catch(() => {});
    }
  }, []);

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      const res = await subscribeUserToPush();
      if (res.success) {
        setPermission("granted");
        toast.success("Notifications push activées avec succès !");
      } else {
        if ("Notification" in window) {
          setPermission(Notification.permission);
        }
        toast.error(res.message || "Impossible d'activer les notifications");
      }
    } catch {
      toast.error("Erreur lors de l'activation des notifications");
    } finally {
      setIsActivating(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      // S'assurer d'abord que le token est bien à jour
      await subscribeUserToPush().catch(() => {});
      const res = await sendTestPushNotification();
      if (res.success) {
        toast.success("Notification envoyée ! Regardez l'écran de votre appareil.");
      } else {
        toast.error(res.error || "Erreur lors de l'envoi");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-3">
      {permission === "granted" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
          <div className="flex items-start gap-3 min-w-0">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-950">
                Notifications push actives sur cet appareil
              </p>
              <p className="text-[11px] text-emerald-800/80 mt-0.5 leading-relaxed">
                Vous recevrez les rappels de créneaux, temps forts et alertes en direct.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={isTesting}
            className="self-start sm:self-auto h-8 px-3 text-xs bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-100/60 rounded-xl font-medium shrink-0 cursor-pointer shadow-xs gap-1.5"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Envoi...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5 text-emerald-600" />
                <span>Tester la réception</span>
              </>
            )}
          </Button>
        </div>
      )}

      {permission === "default" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
          <div className="flex items-start gap-3">
            <BellRing className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-indigo-950">
                Activez les alertes push sur cet appareil
              </p>
              <p className="text-[11px] text-indigo-700 mt-0.5 leading-relaxed">
                Recevez directement vos rappels de créneaux de prière et les temps forts.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleActivate}
            disabled={isActivating}
            className="self-start sm:self-auto bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 font-semibold text-xs rounded-xl shadow-xs h-8 px-3.5 cursor-pointer"
          >
            {isActivating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Activation...
              </>
            ) : (
              <>
                <BellRing className="h-3.5 w-3.5 mr-1.5" />
                Activer
              </>
            )}
          </Button>
        </div>
      )}

      {permission === "denied" && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-amber-900 leading-relaxed">
            <p className="font-semibold text-xs">Notifications bloquées par votre navigateur</p>
            <p className="text-[11px] mt-0.5 text-amber-800">
              Pour réactiver les alertes, cliquez sur l&apos;icône de cadenas ou paramètres du site à côté de l&apos;URL et autorisez les notifications.
            </p>
          </div>
        </div>
      )}

      {permission === "unsupported" && (
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
          Les notifications push ne sont pas supportées sur ce navigateur.
        </div>
      )}
    </div>
  );
}
