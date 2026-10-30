"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Download, X, Share, PlusSquare, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { urlBase64ToUint8Array } from "@/lib/utils";
import { savePushSubscription } from "@/app/actions/push-subscription";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DEFAULT_VAPID_PUBLIC_KEY =
  "BGZYRSOOiM424bgqk0oHsYqcDNYtWpMwbXpAcUk5DT98o3cL1nmHke_gfOSBI9dLdshvfgj9cM-xyc8BwYMNXag";

function getVapidPublicKey(): string {
  const envKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").trim().replace(/^["']|["']$/g, "");
  if (envKey.length >= 80 && !envKey.includes("votre_")) {
    return envKey;
  }
  return DEFAULT_VAPID_PUBLIC_KEY;
}

// Fonction d'abonnement exportée pour être réutilisée partout (ex: cloche de notif, profil)
export async function subscribeUserToPush(): Promise<{ success: boolean; message?: string }> {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return { success: false, message: "Les notifications ne sont pas supportées sur cet appareil." };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, message: "Autorisation des notifications refusée." };
    }

    const registration = await navigator.serviceWorker.ready;
    const convertedKey = urlBase64ToUint8Array(getVapidPublicKey());

    let subscription = await registration.pushManager.getSubscription();

    // Vérifier si l'abonnement existant utilise bien la clé VAPID actuelle
    if (subscription) {
      let isKeyMatching = false;
      try {
        const rawKey = subscription.options?.applicationServerKey;
        if (rawKey) {
          const subKeyArray = new Uint8Array(rawKey);
          if (subKeyArray.length === convertedKey.length) {
            isKeyMatching = subKeyArray.every((val, idx) => val === convertedKey[idx]);
          }
        }
      } catch {
        isKeyMatching = false;
      }

      // Si la clé VAPID a changé ou est obsolète, renouveler l'abonnement
      if (!isKeyMatching) {
        await subscription.unsubscribe().catch(() => {});
        subscription = null;
      }
    }

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey as unknown as BufferSource,
      });
    }

    const subJson = subscription.toJSON();
    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
      return { success: false, message: "Impossible de générer le jeton d'abonnement." };
    }

    const res = await savePushSubscription(
      {
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
      },
      navigator.userAgent
    );

    return res;
  } catch (error) {
    console.error("[PWA] Erreur abonnement push:", error);
    return { success: false, message: "Erreur lors de l'abonnement aux notifications." };
  }
}

export function PwaManager() {
  const { data: session, status } = useSession();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIos] = useState(() => {
    if (typeof window === "undefined") return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
  });
  const [isStandalone] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  // Synchronisation automatique de l'abonnement Push dès que l'utilisateur est authentifié
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      subscribeUserToPush().catch(() => {});
    }
  }, [status, session]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Enregistrement du Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(async (registration) => {
          registration.update().catch(() => {});

          // Si les notifications sont déjà accordées, synchroniser discrètement l'abonnement
          if ("Notification" in window && Notification.permission === "granted") {
            try {
              const convertedKey = urlBase64ToUint8Array(getVapidPublicKey());
              let sub = await registration.pushManager.getSubscription();
              if (!sub) {
                sub = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: convertedKey as unknown as BufferSource,
                });
              }
              const subJson = sub.toJSON();
              if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
                await savePushSubscription(
                  {
                    endpoint: subJson.endpoint,
                    keys: { p256dh: subJson.keys.p256dh, auth: subJson.keys.auth },
                  },
                  navigator.userAgent
                );
              }
            } catch {
              // Échec silencieux de la synchronisation d'arrière-plan
            }
          }
        })
        .catch((error) => {
          console.warn("[PWA] Erreur enregistrement SW:", error);
        });
    }

    // 2. Capture de l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);

      const dismissedUntil = localStorage.getItem("pwa_dismissed_until");
      const isDismissed = dismissedUntil && new Date().getTime() < parseInt(dismissedUntil, 10);
      if (!isDismissed && !isStandalone) {
        setIsBannerVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Si sur iOS et pas encore installé
    if (isIos && !isStandalone) {
      const dismissedUntil = localStorage.getItem("pwa_dismissed_until");
      const isDismissed = dismissedUntil && new Date().getTime() < parseInt(dismissedUntil, 10);
      if (!isDismissed) {
        const timer = setTimeout(() => setIsBannerVisible(true), 3000);
        return () => {
          clearTimeout(timer);
          window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
      }
    }

    // 3. Suivi du statut de connexion (Online / Offline)
    const handleOnline = () => toast.success("Connexion Internet rétablie !");
    const handleOffline = () => toast.warning("Vous êtes actuellement hors ligne.");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isIos, isStandalone]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsBannerVisible(false);
        setIsInstallable(false);
        setDeferredPrompt(null);
        toast.success("Application installée avec succès !");
      }
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismissBanner = () => {
    setIsBannerVisible(false);
    const inSevenDays = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem("pwa_dismissed_until", inSevenDays.toString());
  };

  return (
    <>
      {/* 1. Bannière d'installation PWA */}
      {isBannerVisible && (isInstallable || isIos) && !isStandalone && (
        <aside
          role="region"
          aria-label="Installation de l'application"
          className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-96 z-50 bg-white/95 backdrop-blur-md rounded-2xl border border-indigo-100 shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Installer l&apos;application
              </h4>
              <p className="text-xs text-gray-600 mt-0.5 leading-snug">
                Ajoutez <strong>Prière ICC</strong> sur votre écran d&apos;accueil pour un accès rapide et hors-ligne.
              </p>

              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg gap-1.5 shadow-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  Installer
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismissBanner}
                  className="h-8 text-xs text-gray-500 hover:text-gray-800 rounded-lg"
                >
                  Plus tard
                </Button>
              </div>
            </div>

            <button
              onClick={handleDismissBanner}
              aria-label="Fermer la bannière"
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </aside>
      )}

      {/* 2. Guide d'installation iOS Safari */}
      {showIosGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base">Installer sur votre iPhone/iPad</h3>
              <button
                onClick={() => setShowIosGuide(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-600">
              <p className="leading-relaxed">
                Suivez ces deux étapes simples dans Safari pour installer l&apos;application sur votre écran d&apos;accueil :
              </p>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-xs">
                  1
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Appuyez sur Partager</p>
                  <p className="text-gray-500 mt-0.5 flex items-center gap-1">
                    Dans la barre de navigation du bas, touchez <Share className="h-3.5 w-3.5 inline text-indigo-600" />.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-xs">
                  2
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Sur l&apos;écran d&apos;accueil</p>
                  <p className="text-gray-500 mt-0.5 flex items-center gap-1">
                    Faites défiler puis touchez <PlusSquare className="h-3.5 w-3.5 inline text-indigo-600" /> <em>Sur l&apos;écran d&apos;accueil</em>.
                  </p>
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs h-9"
              onClick={() => setShowIosGuide(false)}
            >
              <Check className="h-4 w-4 mr-1.5" />
              J&apos;ai compris
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
