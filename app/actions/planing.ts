// app/actions/planning.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { addDays, startOfWeek, endOfWeek, setHours, setMinutes, getDay, format } from "date-fns";
import { sendSMS } from "@/lib/sms";
import { fr } from "date-fns/locale";
import { PlaningWithIntercessor } from "@/lib/types";
import { createNotification } from "./notifications";
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
  const realPlannings:PlaningWithIntercessor[] = await prisma.planning.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      specialEventId: null
    },
    include: {
      intercessors: true 
    }
    
  });

  // Fusionner et trier
  const allEvents = realPlannings.sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return { success: true, data: allEvents };
}



// --- ACTIONS D'ÉCRITURE ---

// Créer un modèle récurrent
export async function createRecurringSchedule(data: any) {
  await checkLeader();
  
  // data: { title, description, dayOfWeek, startTime (HH:mm), endTime (HH:mm) }
  

  await prisma.recurringSchedule.create({
    data: {
      title: data.title,
      description: data.description,
      dayOfWeek: parseInt(data.dayOfWeek),
      startTime: data.startTime,
      endTime: data.endTime,
    }
  });
  
  revalidatePath("/dashboard/leader/planning");
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
      include: { intercessors: true }
    });

    const currentIds = currentEvent?.intercessors.map(u => u.id) || [];
    // Trouver les IDs qui sont dans la nouvelle liste MAIS PAS dans l'ancienne
    const newIds = intercessorIds.filter((uid: string) => !currentIds.includes(uid));

    await prisma.planning.update({
      where: { id },
      data: {
        title, description,
        startTime: startTime,
        endTime: endTime,
        intercessors: { set: connectIntercessors }
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
        "Programme",
        `Vous êtes de service  le ${ format(date,  "dd:MM:yyyy")} à ${startTime}`,
        "INFO",
        `/dashboard/`
        );
        if (user.phone) {
          await sendSMS(
            user.phone, 
            `Bonjour ${user.name}, LE MDPI vous informe que vous êtes de service le  ${ format(date,  "dd:MM:yyyy")},  à ${startTime}. Merci de consulter le planing. Excellente journée !`
          );
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
        intercessors: { connect: connectIntercessors },
        date: new Date(date)
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
            `Bonjour ${user.name}, vous avez été programmé pour "${title}" le ${ format(date, 'DD:mm:yyy')}.`
          );
        }
      });
    }
  }

  revalidatePath("/dashboard/leader/planning");
  revalidatePath("/dashboard/leader/events"); 
  return { success: true , date: date};
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