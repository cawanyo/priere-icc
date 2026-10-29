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

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return { success: false, error: "ID utilisateur manquant" };
  }

  try {
    await prisma.pushSubscription.upsert({
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

    return { success: true, message: "Abonnement push enregistré" };
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
export async function sendTestPushNotification() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { success: false, error: "Non connecté" };
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return { success: false, error: "ID manquant" };
  }

  await sendWebPushToUser(userId, {
    title: "Test de Notification Push 🎉",
    body: "Votre appareil est bien configuré pour recevoir les notifications de Prière ICC !",
    url: "/dashboard",
  });

  return { success: true, message: "Notification de test envoyée !" };
}
