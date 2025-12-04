// app/actions/planning.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { addDays, startOfWeek, endOfWeek, setHours, setMinutes, getDay, format } from "date-fns";
import { sendSMS } from "@/lib/sms";
import { fr } from "date-fns/locale";
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

export async function getPlanningEvents(startDate: Date, endDate: Date) {
  await checkLeader();

  // 1. Récupérer les événements "Réels" (Planning) dans la plage
  const realPlannings = await prisma.planning.findMany({
    where: {
      startTime: { gte: startDate },
      endTime: { lte: endDate },
    },
    include: {
      intercessors: { select: { id: true, name: true, image: true } }
    }
  });

  // 2. Récupérer les modèles récurrents (RecurringSchedule)
  const recurringSchedules = await prisma.recurringSchedule.findMany();

  // 3. Générer les occurrences "Virtuelles" pour la plage de dates
  const virtualEvents = [];
  
  // On parcourt chaque jour de la plage demandée
  let current = new Date(startDate);
  while (current <= endDate) {
    const dayIndex = getDay(current); // 0-6

    // On cherche les modèles qui correspondent à ce jour de la semaine
    const schedulesForDay = recurringSchedules.filter(s => s.dayOfWeek === dayIndex);

    for (const schedule of schedulesForDay) {
      // Vérifier s'il existe DÉJÀ un événement réel lié à ce modèle pour ce jour précis
      // On compare les dates (sans les heures) ou via l'ID de récurrence si on l'a stocké
      // Pour simplifier ici : on regarde si un event réel existe ce jour là avec le même recurringId
      // Ou on part du principe que si le leader a créé un event ce jour là, ça remplace.
      
      const startOfDay = new Date(current);
      startOfDay.setHours(schedule.startTime.getHours(), schedule.startTime.getMinutes());
      
      const endOfDay = new Date(current);
      endOfDay.setHours(schedule.endTime.getHours(), schedule.endTime.getMinutes());

      const exists = realPlannings.find(p => 
        p.recurringId === schedule.id && 
        p.startTime.getDate() === current.getDate() &&
        p.startTime.getMonth() === current.getMonth()
      );

      if (!exists) {
        // Création de l'événement virtuel
        virtualEvents.push({
          id: `virtual-${schedule.id}-${format(current, 'yyyy-MM-dd')}`, // ID temporaire unique
          isVirtual: true, // Indicateur pour le frontend
          recurringId: schedule.id,
          title: schedule.title,
          description: schedule.description,
          startTime: startOfDay,
          endTime: endOfDay,
          intercessors: [] // Pas d'intercesseurs par défaut sur un virtuel
        });
      }
    }
    current = addDays(current, 1);
  }

  // Fusionner et trier
  const allEvents = [...realPlannings, ...virtualEvents].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return { success: true, data: allEvents };
}

// --- ACTIONS D'ÉCRITURE ---

// Créer un modèle récurrent
export async function createRecurringSchedule(data: any) {
  await checkLeader();
  
  // data: { title, description, dayOfWeek, startTime (HH:mm), endTime (HH:mm) }
  const start = new Date(`1970-01-01T${data.startTime}:00`);
  const end = new Date(`1970-01-01T${data.endTime}:00`);

  await prisma.recurringSchedule.create({
    data: {
      title: data.title,
      description: data.description,
      dayOfWeek: parseInt(data.dayOfWeek),
      startTime: start,
      endTime: end,
    }
  });
  
  revalidatePath("/dashboard/leader/planning");
  return { success: true };
}

// Créer ou Mettre à jour un événement réel (Planning)
export async function savePlanningEvent(data: any) {
  await checkLeader();

  const { id, title, description, startTime, endTime, intercessorIds, recurringId, specialEventId } = data;
  const connectIntercessors = intercessorIds.map((id: string) => ({ id }));

  // Date formatée pour le SMS (ex: "Lundi 24 Oct à 19h00")
  const dateStr = format(new Date(startTime), "EEEE d MMM 'à' HH'h'mm", { locale: fr });

  if (id && !id.startsWith("virtual-")) {
    // --- CAS UPDATE : On notifie seulement les nouveaux ---
    
    // 1. Récupérer l'état actuel pour comparer
    const currentEvent = await prisma.planning.findUnique({
      where: { id },
      include: { intercessors: true }
    });

    const currentIds = currentEvent?.intercessors.map(u => u.id) || [];
    // Trouver les IDs qui sont dans la nouvelle liste MAIS PAS dans l'ancienne
    const newIds = intercessorIds.filter((uid: string) => !currentIds.includes(uid));

    await prisma.planning.update({
      where: { id },
      data: {
        title, description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        intercessors: { set: connectIntercessors }
      }
    });

    // 2. Envoyer les SMS aux nouveaux
    if (newIds.length > 0) {
      const newIntercessors = await prisma.user.findMany({
        where: { id: { in: newIds } },
        select: { phone: true, name: true }
      });

      // Envoi asynchrone (on n'attend pas la fin pour répondre au client)
      newIntercessors.forEach(user => {
        if (user.phone) {
          sendSMS(
            user.phone, 
            `Bonjour ${user.name}, LE MDPI vous informa que vous êtes de service le  ${dateStr} à ${startTime}. Merci de consulter le planing. Excellente journée !`
          );
        }
      });
    }

  } else {
    // --- CAS CREATE : On notifie tout le monde ---
    
    await prisma.planning.create({
      data: {
        title, description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        recurringId: recurringId || null,
        specialEventId: specialEventId || null,
        intercessors: { connect: connectIntercessors }
      }
    });

    // Récupérer les numéros
    if (intercessorIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: intercessorIds } },
        select: { phone: true, name: true }
      });

      users.forEach(user => {
        if (user.phone) {
          sendSMS(
            user.phone, 
            `Bonjour ${user.name}, vous avez été programmé pour "${title}" le ${dateStr}.`
          );
        }
      });
    }
  }

  revalidatePath("/dashboard/leader/planning");
  revalidatePath("/dashboard/leader/events"); 
  return { success: true };
}
export async function deletePlanningEvent(id: string) {
    await checkLeader();
    await prisma.planning.delete({ where: { id } });
    revalidatePath("/dashboard/leader/planning");
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
      revalidatePath("/dashboard/leader/planning");
      return { success: true, message: "Programme récurrent supprimé" };
    } catch (error) {
      return { success: false, message: "Erreur suppression" };
    }
  }