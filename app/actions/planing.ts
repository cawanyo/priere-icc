// app/actions/planning.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { addDays, startOfWeek, endOfWeek, setHours, setMinutes, getDay, format, startOfDay, endOfDay, addWeeks } from "date-fns";
import { sendSMS } from "@/lib/sms";
import { fr } from "date-fns/locale";
import { PlaningWithIntercessor } from "@/lib/types";
import { createNotification } from "./notifications";
import { broadcastRealtime } from "@/lib/realtime-server";
import { REALTIME_CHANNELS, REALTIME_EVENTS } from "@/lib/realtime-channels";
import { generateRecurringPlannings } from "@/lib/recurring";
// Vérification accès Leader
async function checkLeader() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session?.user?.id) throw new Error("Non connecté");
  // @ts-ignore
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "LEADER" && user?.role !== "ADMIN") throw new Error("Accès interdit");
  return user;
}

// --- RÉCUPÉRATION DU PLANNING ---

export async function getPlanningEvents(startDate: String, endDate: String) {
  await checkLeader();

  const start = new Date(startDate.toString());
  const end = new Date(endDate.toString()); 

  // 1. Générer automatiquement les créneaux récurrents pour la semaine demandée
  await generateRecurringPlannings(start, end);

  // 2. Marge de sécurité d'un jour pour englober tous les créneaux sans biais de fuseau horaire
  const queryStart = startOfDay(addDays(start, -1));
  const queryEnd = endOfDay(addDays(end, 1));

  // 3. Récupérer les événements réels (Planning) dans la plage
  const realPlannings: PlaningWithIntercessor[] = await prisma.planning.findMany({
    where: {
      date: { gte: queryStart, lte: queryEnd },
      specialEventId: null
    },
    include: {
      users: true 
    }
  });

  // 4. Trier par heure de début
  const allEvents = realPlannings.sort((a, b) => 
    (a.startTime || "00:00").localeCompare(b.startTime || "00:00")
  );

  return { success: true, data: allEvents };
}



// --- ACTIONS D'ÉCRITURE ---

// Créer un modèle récurrent
export async function createRecurringSchedule(data: any) {
  await checkLeader();
  
  // data: { title, description, dayOfWeek, startTime (HH:mm), endTime (HH:mm) }
  const schedule = await prisma.recurringSchedule.create({
    data: {
      title: data.title,
      description: data.description,
      dayOfWeek: parseInt(data.dayOfWeek),
      startTime: data.startTime,
      endTime: data.endTime,
    }
  });

  // Générer immédiatement les créneaux pour la semaine en cours et les 12 prochaines semaines
  const now = new Date();
  const start = startOfWeek(addWeeks(now, -1), { weekStartsOn: 1 });
  const end = endOfWeek(addWeeks(now, 12), { weekStartsOn: 1 });
  await generateRecurringPlannings(start, end);
  
  await broadcastRealtime(REALTIME_CHANNELS.PRAYER_PLANNING, REALTIME_EVENTS.UPDATE, {
    type: "recurring-created",
    scheduleId: schedule.id,
  });

  revalidatePath("/dashboard/leader/planning");
  revalidatePath("/dashboard/user/intercessor/planning");
  return { success: true };
}

// Créer ou Mettre à jour un événement réel (Planning)
export async function savePlanningEvent(data: any) {
  await checkLeader();

  const { id, title, description, startTime, endTime, intercessorIds, recurringId, specialEventId, date } = data;
  const connectIntercessors = intercessorIds.map((id: string) => ({ id }));



  if (id) {
    // 1. Récupérer l'état actuel pour comparer
    const currentEvent = await prisma.planning.findUnique({
      where: { id },
      include: { users: true }
    });

    if (!currentEvent) throw new Error("Événement introuvable");

    const event = currentEvent.specialEventId 
      ? await prisma.specialEvent.findUnique({ where: { id: currentEvent.specialEventId } }) 
      : null;

    const currentIds = currentEvent.users.map(u => u.id);
    // Trouver les IDs qui sont dans la nouvelle liste MAIS PAS dans l'ancienne
    const newIds = intercessorIds.filter((uid: string) => !currentIds.includes(uid));

    await prisma.planning.update({
      where: { id },
      data: {
        title, description,
        startTime: startTime,
        endTime: endTime,
        users: { set: connectIntercessors }
      }
    });

    // 2. Envoyer les SMS aux nouveaux
    if (newIds.length > 0) {
      const newIntercessors = await prisma.user.findMany({
        where: { id: { in: newIds } },
        select: { phone: true, name: true, id:true }
      });

      //Envoi asynchrone (on n'attend pas la fin pour répondre au client)

      await Promise.all(newIntercessors.map(async (user) => {
        await createNotification(
          user.id,
          "Planning de Prière",
          `Vous êtes de service le ${format(new Date(date), "dd/MM/yyyy")} à ${startTime}`,
          "INFO",
          "/dashboard/desktop/planning"
        );
        if (user.phone) {
          await sendSMS({
            to: user.phone, 
            message: `Bonjour ${user.name?.split(" ")[0]}, LE MDPI vous informe que vous êtes de service le  ${ format(new Date(date),  "EEEE dd/MM/yyyy", { locale: fr })},  à ${startTime} pour ${event?.title}. Merci de consulter le planing.!`
        });
        }
        }
      )
    )

    }

  } else {
    // --- CAS CREATE : On notifie tout le monde ---
    
    await prisma.planning.create({
      data: {
        title, description,
        startTime: startTime,
        endTime: endTime,
        recurringId: recurringId || null,
        specialEventId: specialEventId || null,
        users: { connect: connectIntercessors },
        date: new Date(date)
      }
    });

    // Récupérer les utilisateurs et envoyer notifications + SMS
    if (intercessorIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: intercessorIds } },
        select: { id: true, phone: true, name: true }
      });

      for (const user of users) {
        await createNotification(
          user.id,
          "Planning de Prière",
          `Vous êtes de service le ${format(new Date(date), "dd/MM/yyyy")} à ${startTime}${title ? ` pour "${title}"` : ""}`,
          "INFO",
          "/dashboard/desktop/planning"
        );
        if (user.phone) {
          sendSMS({
            to: user.phone, 
            message: `Bonjour ${user.name?.split(" ")[0]}, vous avez été programmé pour "${title}" le ${ format(new Date(date), 'dd/MM/yyyy')}.`
          });
        }
      }
    }
  }

  await broadcastRealtime(REALTIME_CHANNELS.PRAYER_PLANNING, REALTIME_EVENTS.UPDATE, {
    type: "planning-saved",
    id,
    specialEventId,
  });

  if (specialEventId) {
    await broadcastRealtime(REALTIME_CHANNELS.SPECIAL_EVENTS, REALTIME_EVENTS.UPDATE, {
      type: "event-planning-saved",
      specialEventId,
    });
  }

  revalidatePath("/dashboard/leader/planning");
  revalidatePath("/dashboard/user/intercessor/planning");
  revalidatePath("/dashboard/leader/events"); 
  return { success: true};
}
export async function deletePlanningEvent(id: string) {
    await checkLeader();
    const event = await prisma.planning.findUnique({ where: { id } });
    await prisma.planning.delete({ where: { id } });

    await broadcastRealtime(REALTIME_CHANNELS.PRAYER_PLANNING, REALTIME_EVENTS.UPDATE, {
      type: "planning-deleted",
      id,
    });

    if (event?.specialEventId) {
      await broadcastRealtime(REALTIME_CHANNELS.SPECIAL_EVENTS, REALTIME_EVENTS.UPDATE, {
        type: "event-planning-deleted",
        specialEventId: event.specialEventId,
      });
    }

    revalidatePath("/dashboard/leader/planning");
    revalidatePath("/dashboard/user/intercessor/planning");
    return { success: true };
}


export async function getRecurringSchedules() {
    await checkLeader();
    try {
      const schedules = await prisma.recurringSchedule.findMany({
        orderBy: { dayOfWeek: 'asc' }
      });
      return { success: true, data: schedules };
    } catch (error) {
      return { success: false, error: "Erreur chargement récurrences" };
    }
  }
  
  export async function deleteRecurringSchedule(id: string) {
    await checkLeader();
    try {
      await prisma.recurringSchedule.delete({ where: { id } });

      // Supprimer les futurs créneaux liés à ce modèle qui n'ont aucun intercesseur inscrit
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const todayDate = new Date(`${todayStr}T00:00:00.000Z`);
      await prisma.planning.deleteMany({
        where: {
          recurringId: id,
          date: { gte: todayDate },
          users: { none: {} },
        },
      });

      await broadcastRealtime(REALTIME_CHANNELS.PRAYER_PLANNING, REALTIME_EVENTS.UPDATE, {
        type: "recurring-deleted",
        id,
      });

      revalidatePath("/dashboard/leader/planning");
      revalidatePath("/dashboard/user/intercessor/planning");
      return { success: true, message: "Programme récurrent supprimé" };
    } catch (error) {
      return { success: false, message: "Erreur suppression" };
    }
  }