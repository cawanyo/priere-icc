"use client";

import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, AlertCircle, Smartphone, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const res = await sendTestPushNotification();
      if (res.success) {
        toast.success("Notification de test envoyée ! Regardez votre écran.");
      } else {
        toast.error(res.error || "Erreur lors de l'envoi de la notification de test");
      }
    } catch {
      toast.error("Erreur inattendue");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-indigo-600" />
              Notifications & Alertes de Prière
            </CardTitle>
            <CardDescription className="mt-1">
              Recevez les rappels de vos créneaux et annonces directement sur votre smartphone ou ordinateur.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {permission === "granted" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-950">
                  Notifications actives sur cet appareil
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Vous recevrez des alertes instantanées même lorsque l&apos;application est fermée.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={isTesting}
              className="bg-white hover:bg-emerald-100 text-emerald-800 border-emerald-200 shrink-0 font-medium text-xs"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Tester la notification
                </>
              )}
            </Button>
          </div>
        )}

        {permission === "default" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
            <div className="flex items-start gap-3">
              <BellRing className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-indigo-950">
                  Activez les notifications push
                </p>
                <p className="text-xs text-indigo-700 mt-0.5">
                  Ne manquez plus aucun créneau de prière ou annonce de l&apos;intercession.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleActivate}
              disabled={isActivating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 font-semibold text-xs shadow-sm"
            >
              {isActivating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Activation...
                </>
              ) : (
                <>
                  <BellRing className="h-3.5 w-3.5 mr-1.5" />
                  Activer sur cet appareil
                </>
              )}
            </Button>
          </div>
        )}

        {permission === "denied" && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-semibold text-sm">Notifications bloquées par votre navigateur</p>
              <p className="mt-1">
                Pour réactiver les notifications, cliquez sur l&apos;icône de cadenas ou de réglages à côté de l&apos;adresse du site dans votre navigateur, puis autorisez les notifications.
              </p>
            </div>
          </div>
        )}

        {permission === "unsupported" && (
          <div className="p-4 rounded-xl bg-gray-50 border text-xs text-gray-500">
            Les notifications Push ne sont pas supportées par ce navigateur ou environnement.
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-3 pt-2 text-xs text-gray-600">
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
            <span className="font-semibold text-gray-900 block mb-1">⏰ Rappels de créneaux</span>
            Rappels automatiques avant le début de votre temps de prière.
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
            <span className="font-semibold text-gray-900 block mb-1">🕊️ Événements spéciaux</span>
            Alertes lors du lancement d&apos;actions de prière 24h ou programmées.
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
            <span className="font-semibold text-gray-900 block mb-1">✅ Validation d&apos;adhésion</span>
            Confirmation immédiate lors de l&apos;approbation de votre rôle.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
