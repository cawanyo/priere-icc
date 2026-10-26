// app/actions/events.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";
import { SpecialEventWithPlaning, TemplatePrisma } from "@/lib/types";
import { SpecialEvent } from "@prisma/client";
import {
  parseUtcMidnight,
  templateAppliesToDate,
  type SpecialEventInput,
  type SpecialEventTemplateInput,
} from "@/lib/event-utils";

async function checkLeader() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Non connecté");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || (user.role !== "LEADER" && user.role !== "ADMIN")) throw new Error("Accès interdit");
  return user;
}

// --- GESTION DES ÉVÉNEMENTS ---

export async function createPlaningForEvent(
  event: SpecialEvent,
  templates: (TemplatePrisma | SpecialEventTemplateInput)[],
  start: Date,
  end: Date
) {
  let current = parseUtcMidnight(start);
  const endDate = parseUtcMidnight(end);
    
  const records = [];
    
  while (current <= endDate) {
    for (const t of templates) {
      if (templateAppliesToDate(t, current)) {
        records.push({
          title: t.title,
          startTime: t.startTime,
          endTime: t.endTime,
          date: new Date(current),
          specialEventId: event.id,
          templateId: t.id,
        });
      }
    }
    current = addDays(current, 1);
  }
    
  // Création groupée des créneaux
  if (records.length > 0) {
    await prisma.planning.createMany({
      data: records,
    });
  }
}

export async function updateTemplate(event: SpecialEvent, template: TemplatePrisma) {
  const t = await prisma.eventTemplate.update({
    where: { id: template.id },
    data: {
      title: template.title,
      startTime: template.startTime,
      endTime: template.endTime,
      daysMode: template.daysMode,
      daysOfWeek: template.daysOfWeek,
      specificDates: template.specificDates,
    }
  });

  await prisma.planning.updateMany({
    where: {
      templateId: t.id
    },
    data: {
      startTime: template.startTime,
      endTime: template.endTime,
      title: template.title
    }
  });
}

export async function createSpecialEvent(data: SpecialEventInput) {
  await checkLeader();
  
  const { title, description, startDate, endDate, templates } = data;

  const eventStartDate = parseUtcMidnight(startDate);
  const eventEndDate = parseUtcMidnight(endDate);

  // TRI DES TEMPLATES PAR HEURE DE DÉBUT AVANT INSERTION
  const sortedTemplates = [...(templates || [])].sort((a, b) => 
    a.startTime.localeCompare(b.startTime)
  );

  const event = await prisma.specialEvent.create({
    data: {
      title,
      description,
      startDate: eventStartDate,
      endDate: eventEndDate,
      eventTemplates: {
        create: sortedTemplates.map((t) => ({
          title: t.title,
          startTime: t.startTime,
          endTime: t.endTime,
          daysMode: t.daysMode || "ALL",
          daysOfWeek: t.daysOfWeek || [],
          specificDates: t.specificDates || [],
        }))
      }
    },
    include: { eventTemplates: true }
  });

  if (!event) {
    return { success: false, message: "Événement non créé" };
  }

  await createPlaningForEvent(event, event.eventTemplates, event.startDate, event.endDate);
  revalidatePath("/dashboard/leader/events");
  return { success: true, message: "Événement créé" };
}

export async function getSpecialEvents() {
  await checkLeader();
  const events = await prisma.specialEvent.findMany({
    orderBy: { startDate: 'desc' },
    include: { 
      eventTemplates: true,
    }
  });
  return { success: true, data: events };
}

export async function getEventDetails(eventId: string) {
  await checkLeader();
  
  const event: SpecialEventWithPlaning | null = await prisma.specialEvent.findUnique({
    where: { id: eventId },
    include: { 
      plannings: { include: { users: true } }
    } 
  });
  if (!event) return { success: false, error: "Événement introuvable" };
  return { success: true, event };
}

export async function updateSpecialEvent(data: SpecialEventInput) {
  await checkLeader();
  
  const { id, title, description, startDate, endDate, templates } = data;
  if (!id) throw new Error("ID de l'événement requis");

  const eventStartDate = parseUtcMidnight(startDate);
  const eventEndDate = parseUtcMidnight(endDate);

  // 1. Mettre à jour les infos principales de l'événement
  await prisma.specialEvent.update({
    where: { id },
    data: {
      title,
      description,
      startDate: eventStartDate,
      endDate: eventEndDate,
    }
  });

  // 2. Gestion des templates
  const incomingTemplateIds = (templates || [])
    .map((t) => t.id)
    .filter((tid): tid is string => Boolean(tid));

  // Supprimer les templates qui ont été retirés (la cascade Prisma supprimera leurs plannings)
  await prisma.eventTemplate.deleteMany({
    where: {
      specialEventId: id,
      id: { notIn: incomingTemplateIds }
    },
  });

  // 3. Mettre à jour ou créer chaque template et ajuster les plannings
  for (const t of (templates || [])) {
    let currentTemplateId = t.id;
    let templateRecord;

    if (currentTemplateId) {
      // Template existant : mise à jour
      templateRecord = await prisma.eventTemplate.update({
        where: { id: currentTemplateId },
        data: {
          title: t.title,
          startTime: t.startTime,
          endTime: t.endTime,
          daysMode: t.daysMode || "ALL",
          daysOfWeek: t.daysOfWeek || [],
          specificDates: t.specificDates || [],
        }
      });

      // Mettre à jour le titre et les heures sur les plannings existants de ce template
      await prisma.planning.updateMany({
        where: { templateId: currentTemplateId },
        data: {
          title: t.title,
          startTime: t.startTime,
          endTime: t.endTime,
        }
      });
    } else {
      // Nouveau template ajouté lors de l'édition
      templateRecord = await prisma.eventTemplate.create({
        data: {
          title: t.title,
          startTime: t.startTime,
          endTime: t.endTime,
          daysMode: t.daysMode || "ALL",
          daysOfWeek: t.daysOfWeek || [],
          specificDates: t.specificDates || [],
          specialEventId: id,
        }
      });
      currentTemplateId = templateRecord.id;
    }

    // Calculer les dates cibles où ce template doit exister entre eventStartDate et eventEndDate
    const targetDatesMap = new Map<string, Date>();
    let iter = new Date(eventStartDate);
    while (iter <= eventEndDate) {
      if (templateAppliesToDate(templateRecord, iter)) {
        const dateKey = iter.toISOString().slice(0, 10);
        targetDatesMap.set(dateKey, new Date(iter));
      }
      iter = addDays(iter, 1);
    }

    // Récupérer les plannings existants pour ce template
    const existingPlannings = await prisma.planning.findMany({
      where: { templateId: currentTemplateId },
      select: { id: true, date: true }
    });

    // - Supprimer les créneaux qui ne sont plus dans les dates cibles
    // - Conserver intacts les créneaux qui y sont (préservation des inscriptions d'intercesseurs)
    for (const ep of existingPlannings) {
      const epDateKey = ep.date.toISOString().slice(0, 10);
      if (targetDatesMap.has(epDateKey)) {
        targetDatesMap.delete(epDateKey);
      } else {
        await prisma.planning.delete({ where: { id: ep.id } });
      }
    }

    // - Créer les créneaux pour les nouvelles dates restantes dans targetDatesMap
    const newRecordsToCreate = [];
    for (const dateObj of Array.from(targetDatesMap.values())) {
      newRecordsToCreate.push({
        title: templateRecord.title,
        startTime: templateRecord.startTime,
        endTime: templateRecord.endTime,
        date: dateObj,
        specialEventId: id,
        templateId: currentTemplateId,
      });
    }

    if (newRecordsToCreate.length > 0) {
      await prisma.planning.createMany({
        data: newRecordsToCreate,
      });
    }
  }

  // 4. Nettoyage de sécurité : supprimer tout planning hors de l'intervalle de l'événement
  await prisma.planning.deleteMany({
    where: {
      specialEventId: id,
      OR: [
        { date: { lt: eventStartDate } },
        { date: { gt: eventEndDate } }
      ]
    }
  });

  revalidatePath("/dashboard/leader/events");
  revalidatePath(`/dashboard/leader/events/${id}`);
  return { success: true, message: "Événement mis à jour" };
}

export async function deleteSpecialEvent(id: string) {
  await checkLeader();
  try {
    await prisma.specialEvent.delete({ where: { id } });
    revalidatePath("/dashboard/leader/events");
    return { success: true, message: "Événement supprimé" };
  } catch {
    return { success: false, message: "Erreur lors de la suppression" };
  }
}
