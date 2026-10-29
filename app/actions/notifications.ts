// app/actions/notification.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { sendWebPushToUser } from "@/lib/web-push";

// Récupérer les notifications de l'utilisateur connecté
export async function getUserNotifications() {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session || !session.user?.id) return { success: false, data: { notifications: [], unreadCount: 0 } };
  
    try {
      const notifications = await prisma.notification.findMany({
        // @ts-ignore
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      
      const unreadCount = await prisma.notification.count({
        where: { 
          // @ts-ignore
          userId: session.user.id, 
          isRead: false 
        }
      });
  
      // CORRECTION ICI : On retourne un objet structuré dans 'data'
      return { 
        success: true, 
        data: { 
          notifications, 
          unreadCount 
        } 
      };
    } catch (error) {
      return { success: false, error: "Erreur chargement notifications" };
    }
  }

// Marquer une notification comme lue
export async function markAsRead(notificationId: string) {
  const session = await getServerSession(authOptions);
  if (!session) return;

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true }
  });
  
  revalidatePath("/dashboard"); // Rafraîchir l'UI
}

// Marquer TOUT comme lu
export async function markAllAsRead() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session || !session.user?.id) return;

  await prisma.notification.updateMany({
    // @ts-ignore
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true }
  });
  
  revalidatePath("/dashboard");
}

// Créer une notification (Utilitaire interne : sauvegarde en base + envoi Push natif)
export async function createNotification(userId: string, title: string, message: string, type: string = "INFO", link?: string) {
  try {
    const notif = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link
      }
    });

    // Envoi de la notification Web Push sur l'écran du smartphone / ordinateur
    try {
      await sendWebPushToUser(userId, {
        title,
        body: message,
        url: link || "/dashboard",
      });
    } catch (pushErr) {
      console.warn("[Notification] Échec envoi push non bloquant:", pushErr);
    }

    return { success: true, data: notif };
  } catch (error) {
    console.error("Erreur création notif:", error);
    return { success: false };
  }
}