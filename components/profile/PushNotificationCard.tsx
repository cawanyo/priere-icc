"use client";

import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { subscribeUserToPush } from "@/components/pwa/PwaManager";

export function PushNotificationCard() {
  const [permission, setPermission] = useState<"granted" | "denied" | "default" | "unsupported">("default");
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
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

  return (
    <div className="space-y-3">
      {permission === "granted" && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-100">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-emerald-950">
              Notifications push actives
            </p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Vous recevrez des alertes pour vos créneaux et annonces en temps réel sur cet appareil.
            </p>
          </div>
        </div>
      )}

      {permission === "default" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
          <div className="flex items-start gap-2.5">
            <BellRing className="h-4.5 w-4.5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-indigo-950">
                Activez les alertes push sur cet appareil
              </p>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Rappels de vos créneaux de prière et temps forts de l&apos;intercession.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleActivate}
            disabled={isActivating}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 font-semibold text-xs rounded-xl shadow-xs"
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
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
          <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-amber-900 leading-relaxed">
            <p className="font-semibold text-xs">Notifications bloquées par votre navigateur</p>
            <p className="text-[11px] mt-0.5">
              Pour réactiver les alertes, cliquez sur l&apos;icône de cadenas ou paramètres à côté de l&apos;URL et autorisez les notifications.
            </p>
          </div>
        </div>
      )}

      {permission === "unsupported" && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
          Les notifications push ne sont pas supportées sur ce navigateur.
        </div>
      )}
    </div>
  );
}
