import webpush from "web-push";
import { prisma } from "@/lib/prisma";

export interface WebPushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
}

const DEFAULT_VAPID_PUBLIC_KEY =
  "BGZYRSOOiM424bgqk0oHsYqcDNYtWpMwbXpAcUk5DT98o3cL1nmHke_gfOSBI9dLdshvfgj9cM-xyc8BwYMNXag";
const DEFAULT_VAPID_PRIVATE_KEY =
  "xVSvu-Ah_aOslFNBicBbP37eJmwXTF6oXMElAB_3-B8";
const DEFAULT_VAPID_SUBJECT = "mailto:contact@priere-icc.com";

let isVapidConfigured = false;

function cleanString(val: string | undefined): string {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "");
}

// Vérifie qu'une clé publique VAPID (base64url) est valide (65 octets décodés commençant par 0x04)
function isValidVapidPublicKey(key: string): boolean {
  try {
    const buf = Buffer.from(key, "base64url");
    return buf.length === 65 && buf[0] === 4;
  } catch {
    return false;
  }
}

// Initialisation paresseuse (lazy) pour éviter toute erreur au chargement des modules lors du build Next.js
function ensureVapidConfigured(): boolean {
  if (isVapidConfigured) return true;

  let publicKey = cleanString(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
  let privateKey = cleanString(process.env.VAPID_PRIVATE_KEY);
  let subject = cleanString(process.env.VAPID_SUBJECT) || DEFAULT_VAPID_SUBJECT;

  // Si la clé publique n'est pas valide ou absente, basculer sur la clé par défaut
  if (!isValidVapidPublicKey(publicKey)) {
    publicKey = DEFAULT_VAPID_PUBLIC_KEY;
  }

  // Si la clé privée est absente ou tronquée, basculer sur la clé par défaut
  if (!privateKey || privateKey.length < 30) {
    privateKey = DEFAULT_VAPID_PRIVATE_KEY;
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    isVapidConfigured = true;
    return true;
  } catch (error) {
    console.warn("[WebPush] Avertissement initialisation VAPID :", error);
    return false;
  }
}

// Envoyer une notification Push native à un utilisateur spécifique (sur tous ses appareils enregistrés)
export async function sendWebPushToUser(userId: string, payload: WebPushPayload) {
  if (!ensureVapidConfigured()) {
    console.warn("[WebPush] VAPID non configuré, notification ignorée.");
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
        // Si l'abonnement est expiré, révoqué ou clé VAPID changée (410, 404, 401, 403)
        if (error.statusCode === 410 || error.statusCode === 404 || error.statusCode === 401 || error.statusCode === 403) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error(`[WebPush] Erreur d'envoi pour sub ${sub.id}:`, err);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error("[WebPush] Erreur sendWebPushToUser:", error);
  }
}

// Envoyer une notification Push native à tous les utilisateurs abonnés
export async function sendWebPushToAll(payload: WebPushPayload) {
  if (!ensureVapidConfigured()) {
    console.warn("[WebPush] VAPID non configuré, notification broadcast ignorée.");
    return;
  }

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
        if (error.statusCode === 410 || error.statusCode === 404 || error.statusCode === 401 || error.statusCode === 403) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }
  } catch (error) {
    console.error("[WebPush] Erreur broadcast push:", error);
  }
}
