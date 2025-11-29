// app/actions/intercessor.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { addDays, getDay, format, isSameDay } from "date-fns";

export async function checkIntercessorAccess() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session || !session.user?.id) throw new Error("Non connecté");
  
  // @ts-ignore
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  
  if (!user || (user.role !== "INTERCESSOR" && user.role !== "LEADER" && user.role !== "ADMIN")) {
    throw new Error("Accès refusé.");
  }
  return user;
}

export async function getIntercessorPlanning(startDate: Date, endDate: Date) {
  try {
    const user = await checkIntercessorAccess();

    // 1. Récupérer les événements "Réels" (Planning)
    const realPlannings = await prisma.planning.findMany({
      where: {
        startTime: { gte: startDate },
        endTime: { lte: endDate },
      },
      include: {
        intercessors: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    // 2. Récupérer les modèles récurrents
    const recurringSchedules = await prisma.recurringSchedule.findMany();

    // 3. Générer les occurrences "Virtuelles"
    const virtualEvents: any[] = [];
    
    let current = new Date(startDate);
    while (current <= endDate) {
      const dayIndex = getDay(current); // 0-6

      const schedulesForDay = recurringSchedules.filter(s => s.dayOfWeek === dayIndex);

      for (const schedule of schedulesForDay) {
        // Calcul des dates précises pour ce jour
        const startOfDay = new Date(current);
        startOfDay.setHours(schedule.startTime.getHours(), schedule.startTime.getMinutes());
        
        const endOfDay = new Date(current);
        endOfDay.setHours(schedule.endTime.getHours(), schedule.endTime.getMinutes());

        // Vérifier si un événement réel remplace déjà cette occurrence
        const exists = realPlannings.find(p => 
          p.recurringId === schedule.id && 
          p.startTime.getDate() === current.getDate() &&
          p.startTime.getMonth() === current.getMonth()
        );

        if (!exists) {
          virtualEvents.push({
            id: `virtual-${schedule.id}-${format(current, 'yyyy-MM-dd')}`,
            isVirtual: true, // Marqueur important
            title: schedule.title,
            description: schedule.description,
            startTime: startOfDay,
            endTime: endOfDay,
            intercessors: [] // Pas d'intercesseurs sur un virtuel
          });
        }
      }
      current = addDays(current, 1);
    }

    // 4. Fusionner et trier
    const allEvents = [...realPlannings, ...virtualEvents].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return { success: true, data: allEvents, currentUserId: user.id };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Impossible de charger le planning." };
  }
}

export async function getIntercessorSpecialEvents() {
  await checkIntercessorAccess();
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
  const user = await checkIntercessorAccess();
  
  const event = await prisma.specialEvent.findUnique({
    where: { id: eventId },
    include: { templates: true }
  });

  if (!event) return { success: false, error: "Événement introuvable" };

  // Récupérer les assignations réelles
  const realPlannings = await prisma.planning.findMany({
    where: { specialEventId: eventId },
    include: { 
        intercessors: { select: { id: true, name: true, image: true } } 
    }
  });

  // Génération du calendrier (Fusion Templates + Réels)
  const allSlots = [];
  let current = new Date(event.startDate);
  const end = new Date(event.endDate);

  while (current <= end) {
    for (const template of event.templates) {
      const slotStart = new Date(current);
      slotStart.setHours(template.startTime.getHours(), template.startTime.getMinutes());
      
      const slotEnd = new Date(current);
      slotEnd.setHours(template.endTime.getHours(), template.endTime.getMinutes());

      const real = realPlannings.find(p => 
        isSameDay(p.startTime, current) && 
        p.startTime.getHours() === slotStart.getHours() &&
        p.startTime.getMinutes() === slotStart.getMinutes()
      );

      if (real) {
        allSlots.push({ ...real, isVirtual: false });
      } else {
        allSlots.push({
          id: `virtual-${template.id}-${format(current, 'yyyy-MM-dd')}`,
          isVirtual: true,
          title: template.title,
          startTime: slotStart,
          endTime: slotEnd,
          intercessors: []
        });
      }
    }
    current = addDays(current, 1);
  }

  // Tri chrono
  allSlots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return { success: true, event, calendar: allSlots, currentUserId: user.id };
}