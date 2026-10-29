import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BGZYRSOOiM424bgqk0oHsYqcDNYtWpMwbXpAcUk5DT98o3cL1nmHke_gfOSBI9dLdshvfgj9cM-xyc8BwYMNXag";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "xVSvu-Ah_aOslFNBicBbP37eJmwXTF6oXMElAB_3-B8";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:contact@priere-icc.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface WebPushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
}

// Envoyer une notification Push native à un utilisateur spécifique (sur tous ses appareils enregistrés)
export async function sendWebPushToUser(userId: string, payload: WebPushPayload) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("[WebPush] Clés VAPID non configurées, push ignoré.");
    return;
  }

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) return;

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/dashboard",
      icon: payload.icon || "/icons/icon-192x192.png",
      tag: payload.tag || "icc-notification",
    });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          notificationPayload
        );
      } catch (err: unknown) {
        const error = err as { statusCode?: number };
        // Si l'abonnement est expiré ou révoqué par le navigateur (410 Gone ou 404 Not Found)
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`[WebPush] Nettoyage abonnement expiré: ${sub.id}`);
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error(`[WebPush] Erreur d'envoi pour sub ${sub.id}:`, err);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error("[WebPush] Erreur globale sendWebPushToUser:", error);
  }
}

// Envoyer une notification Push native à tous les utilisateurs abonnés
export async function sendWebPushToAll(payload: WebPushPayload) {
  if (!vapidPublicKey || !vapidPrivateKey) return;

  try {
    const subscriptions = await prisma.pushSubscription.findMany();
    if (subscriptions.length === 0) return;

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/dashboard",
      icon: payload.icon || "/icons/icon-192x192.png",
      tag: payload.tag || "icc-broadcast",
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          notificationPayload
        );
      } catch (err: unknown) {
        const error = err as { statusCode?: number };
        if (error.statusCode === 410 || error.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }
  } catch (error) {
    console.error("[WebPush] Erreur broadcast push:", error);
  }
}
