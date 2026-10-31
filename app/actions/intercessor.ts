// app/actions/intercessor.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { addDays, getDay, format, isSameDay, startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";
import { broadcastRealtime } from "@/lib/realtime-server";
import { REALTIME_CHANNELS, REALTIME_EVENTS } from "@/lib/realtime-channels";
import { projectRecurringSlots } from "@/lib/recurring";
export async function checkIntercessorAccess() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; email?: string } | undefined;
  if (!sessionUser?.id && !sessionUser?.email) throw new Error("Non connecté");

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        ...(sessionUser.id ? [{ id: sessionUser.id }] : []),
        ...(sessionUser.email ? [{ email: sessionUser.email }] : [])
      ]
    }
  });

  if (!user) {
    throw new Error("Accès refusé.");
  }
  return user;
}

export async function checkIntercessorOrPrayerLeaderAccess() {
  return checkIntercessorAccess();
}

export async function getIntercessorPlanning(startDate: String, endDate: String) {
  try {
    const rawStart = new Date(startDate.toString());
    const rawEnd = new Date(endDate.toString());  
    const user = await checkIntercessorAccess();

    // Marge de sécurité d'un jour pour englober tous les créneaux sans biais de fuseau horaire
    const queryStart = startOfDay(addDays(rawStart, -1));
    const queryEnd = endOfDay(addDays(rawEnd, 1));

    // 1. Récupérer les événements réels (Planning)
    const realPlannings = await prisma.planning.findMany({
      where: {
        date: { gte: queryStart, lte: queryEnd },
        specialEventId: null
      },
      include: {
        users: true
      }
    });

    // 2. Projeter dynamiquement les récurrences virtuelles (isVirtual: true) avec pointillés
    const allEvents = await projectRecurringSlots(rawStart, rawEnd, realPlannings);

    return { success: true, data: allEvents, currentUserId: user.id };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Impossible de charger le planning." };
  }
}

export async function getIntercessorSpecialEvents() {
  await checkIntercessorOrPrayerLeaderAccess();
  try {
    const events = await prisma.specialEvent.findMany({
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { plannings: true } } }
    });
    return { success: true, data: events };
  } catch (error) {
    return { success: false, error: "Erreur chargement événements" };
  }
}

// 2. Récupérer le calendrier complet d'un événement (Logique similaire à celle du leader mais read-only)
export async function getIntercessorEventDetails(eventId: string) {
  const user = await checkIntercessorOrPrayerLeaderAccess()
  
  const event = await prisma.specialEvent.findUnique({
    where: { id: eventId },
    include: {plannings: {include: {users: true}}}
  });

  if (!event) return { success: false, error: "Événement introuvable" };

 

  return { success: true, event, currentUserId: user.id };
}



export async function selfAssignToEventSlot(slotData: any) {
  const user = await checkIntercessorOrPrayerLeaderAccess();

  try {
    const { id, isVirtual, specialEventId, title, description, startTime, endTime, recurringId, date } = slotData;

    const isSlotVirtual = !id || (typeof id === "string" && id.startsWith("virtual-")) || Boolean(isVirtual);
    let targetPlanningId = id;

    if (isSlotVirtual) {
      // Matérialiser le créneau virtuel récurrent en créneau réel dans la table Planning !
      const slotDate = new Date(date);
      const createdSlot = await prisma.planning.create({
        data: {
          title: title || "Intercession",
          description: description || null,
          startTime,
          endTime,
          recurringId: recurringId || null,
          specialEventId: null,
          date: slotDate,
          users: {
            connect: [{ id: user.id }],
          },
        },
      });
      targetPlanningId = createdSlot.id;
    } else {
      // C'est déjà un créneau réel -> On met à jour la liste des intercesseurs
      await prisma.planning.update({
        where: { id },
        data: {
          users: {
            connect: { id: user.id }
          }
        }
      });
    }

    try {
      await createNotification(
        user.id,
        "Créneau confirmé 🕊️",
        `Vous êtes inscrit(e) sur le créneau "${title || "Intercession"}" de ${startTime} à ${endTime}.`,
        "SUCCESS",
        specialEventId ? `/dashboard/user/intercessor/events/${specialEventId}` : "/dashboard/desktop/planning"
      );
    } catch (pushErr) {
      console.warn("[Intercessor] Notification push non bloquante:", pushErr);
    }

    try {
      if (specialEventId) {
        await broadcastRealtime(REALTIME_CHANNELS.SPECIAL_EVENTS, REALTIME_EVENTS.UPDATE, {
          type: "slot-assigned",
          specialEventId,
          slotId: targetPlanningId,
          userId: user.id,
        });
      } else {
        await broadcastRealtime(REALTIME_CHANNELS.PRAYER_PLANNING, REALTIME_EVENTS.UPDATE, {
          type: "slot-assigned",
          slotId: targetPlanningId,
          userId: user.id,
        });
      }
    } catch (rtErr) {
      console.warn("[Intercessor] Realtime broadcast non bloquant:", rtErr);
    }

    revalidatePath("/dashboard/user/intercessor/events");
    revalidatePath("/dashboard/user/intercessor/planning");
    revalidatePath("/dashboard/leader/planning");
    return { success: true, message: "Vous êtes inscrit sur ce créneau." };
  } catch (error) {
    return { success: false, message: "Erreur lors de l'inscription." };
  }
}

// Se désinscrire d'un créneau
export async function selfRemoveFromEventSlot(planningId: string, targetUserId?: string) {
  try {
    const user = await checkIntercessorOrPrayerLeaderAccess();

    const slot = await prisma.planning.findUnique({
      where: { id: planningId },
      include: { users: true }
    });

    if (!slot) {
      return { success: false, message: "Créneau introuvable." };
    }

    // Déterminer l'utilisateur à déconnecter
    let disconnectId = user.id;

    if (targetUserId && (user.role === "ADMIN" || user.role === "LEADER")) {
      disconnectId = targetUserId;
    } else {
      // Trouver l'utilisateur sur le créneau par son id OU son email
      const matched = slot.users.find(
        (u) => u.id === user.id || (user.email && u.email?.toLowerCase() === user.email.toLowerCase())
      );
      if (matched) {
        disconnectId = matched.id;
      }
    }

    await prisma.planning.update({
      where: { id: planningId },
      data: {
        users: {
          disconnect: { id: disconnectId }
        }
      }
    });

    try {
      await createNotification(
        disconnectId,
        "Désinscription confirmée 🕊️",
        `Votre retrait du créneau "${slot.title || "Intercession"}" (${slot.startTime} - ${slot.endTime}) a été pris en compte.`,
        "INFO",
        slot.specialEventId ? `/dashboard/user/intercessor/events/${slot.specialEventId}` : "/dashboard/desktop/planning"
      );
    } catch (pushErr) {
      console.warn("[Intercessor] Notification push non bloquante:", pushErr);
    }

    try {
      if (slot.specialEventId) {
        await broadcastRealtime(REALTIME_CHANNELS.SPECIAL_EVENTS, REALTIME_EVENTS.UPDATE, {
          type: "slot-removed",
          specialEventId: slot.specialEventId,
          slotId: planningId,
          userId: disconnectId,
        });
      } else {
        await broadcastRealtime(REALTIME_CHANNELS.PRAYER_PLANNING, REALTIME_EVENTS.UPDATE, {
          type: "slot-removed",
          slotId: planningId,
          userId: disconnectId,
        });
      }
    } catch (rtErr) {
      console.warn("[Intercessor] Realtime broadcast non bloquant:", rtErr);
    }

    revalidatePath("/dashboard/user/intercessor/events");
    revalidatePath("/dashboard/user/intercessor/planning");
    revalidatePath("/dashboard/desktop/planning");
    revalidatePath("/dashboard/mobile/planning");
    revalidatePath("/dashboard/leader/planning");
    return { success: true, message: "Vous vous êtes retiré(e) du créneau avec succès." };
  } catch (error) {
    console.error("[selfRemoveFromEventSlot] Erreur:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erreur lors du retrait.",
    };
  }
}