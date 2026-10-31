"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sendWebPushToUser } from "@/lib/web-push";

interface PushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Enregistrer ou mettre à jour l'abonnement Push de l'appareil de l'utilisateur
export async function savePushSubscription(
  subscription: PushSubscriptionInput,
  userAgent?: string
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Non authentifié" };
  }

  let userId = (session.user as { id?: string }).id;
  let userExists = false;

  if (userId) {
    const check = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (check) userExists = true;
  }

  if (!userExists && session.user.email) {
    const u = await prisma.user.findFirst({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (u) {
      userId = u.id;
      userExists = true;
    }
  }

  if (!userExists || !userId) {
    return { success: false, error: "Utilisateur introuvable en base de données" };
  }

  try {
    const record = await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent || null,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent || null,
      },
    });

    console.log(`[Push] Abonnement Web Push enregistré dans la table PushSubscription (id: ${record.id}, user: ${userId})`);
    return { success: true, message: "Abonnement push enregistré", subscriptionId: record.id };
  } catch (error) {
    console.error("[Push] Erreur enregistrement abonnement:", error);
    return { success: false, error: "Erreur lors de l'enregistrement de l'appareil" };
  }
}

// Supprimer l'abonnement push lors d'une déconnexion ou désactivation
export async function deletePushSubscription(endpoint: string) {
  try {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

// Envoyer une notification de test à l'utilisateur connecté
export async function sendTestPushNotification(customBody?: string, customTitle?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Non connecté" };
  }

  let userId = (session.user as { id?: string }).id;
  if (!userId && session.user.email) {
    const u = await prisma.user.findFirst({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (u) userId = u.id;
  }
  if (!userId) {
    return { success: false, error: "ID manquant" };
  }

  const title = customTitle || "Ministère de la Prière ICC";
  const body = customBody || "Notifications acceptées";

  await sendWebPushToUser(userId, {
    title,
    body,
    url: "/dashboard",
  });

  return { success: true, message: "Notification de test envoyée !" };
}
