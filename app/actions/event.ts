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
import { sendWebPushToAll } from "@/lib/web-push";

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

  try {
    await sendWebPushToAll({
      title: `Nouvel Événement : ${event.title} 🕊️`,
      body: "Un nouveau temps fort d'intercession est planifié. Consultez et réservez vos créneaux !",
      url: `/dashboard/user/intercessor/events/${event.id}`,
    });
  } catch (e) {
    console.warn("[Event] Échec push broadcast:", e);
  }

  revalidatePath("/dashboard/leader/events");
  revalidatePath("/dashboard/user/intercessor/events");
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

  // 2. Récupérer TOUS les plannings actuels de cet événement
  // Important : on charge les plannings avant toute modification de template
  // pour pouvoir réconcilier les créneaux par (date + heure début + heure fin)
  const existingPlannings = await prisma.planning.findMany({
    where: { specialEventId: id },
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      title: true,
      templateId: true,
    }
  });

  // 3. Traiter les templates reçus (mettre à jour les existants ou créer les nouveaux)
  const incomingTemplates = templates || [];
  const validTemplateRecords = [];

  for (const t of incomingTemplates) {
    if (t.id) {
      // Template existant : mise à jour
      const updated = await prisma.eventTemplate.update({
        where: { id: t.id },
        data: {
          title: t.title,
          startTime: t.startTime,
          endTime: t.endTime,
          daysMode: t.daysMode || "ALL",
          daysOfWeek: t.daysOfWeek || [],
          specificDates: t.specificDates || [],
        }
      });
      validTemplateRecords.push(updated);
    } else {
      // Nouveau template
      const created = await prisma.eventTemplate.create({
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
      validTemplateRecords.push(created);
    }
  }

  const validTemplateIds = validTemplateRecords.map((tr) => tr.id);

  // 4. Calculer tous les créneaux cibles attendus selon les templates et les dates de l'événement
  interface TargetSlot {
    date: Date;
    dateKey: string;
    startTime: string;
    endTime: string;
    title: string;
    templateId: string;
  }

  const targetSlotsMap = new Map<string, TargetSlot>();

  for (const tmpl of validTemplateRecords) {
    let iter = new Date(eventStartDate);
    while (iter <= eventEndDate) {
      if (templateAppliesToDate(tmpl, iter)) {
        const dateKey = iter.toISOString().slice(0, 10);
        // Clé unique d'un créneau identique : date + heure début + heure fin
        const slotKey = `${dateKey}_${tmpl.startTime}_${tmpl.endTime}`;
        targetSlotsMap.set(slotKey, {
          date: new Date(iter),
          dateKey,
          startTime: tmpl.startTime,
          endTime: tmpl.endTime,
          title: tmpl.title,
          templateId: tmpl.id,
        });
      }
      iter = addDays(iter, 1);
    }
  }

  // 5. Réconciliation intelligente des créneaux :
  // - Conserver les créneaux identiques (date + heure début + heure fin) en préservant les personnes planifiées
  // - Supprimer les créneaux de l'ancien planning qui ne correspondent plus aux nouveaux horaires
  // - Créer les nouveaux créneaux ajoutés
  for (const ep of existingPlannings) {
    const epDateKey = ep.date.toISOString().slice(0, 10);
    const epSlotKey = `${epDateKey}_${ep.startTime}_${ep.endTime}`;

    if (targetSlotsMap.has(epSlotKey)) {
      // CRÉNEAU IDENTIQUE TROUVÉ : on le conserve intact pour préserver les personnes planifiées
      const target = targetSlotsMap.get(epSlotKey)!;
      await prisma.planning.update({
        where: { id: ep.id },
        data: {
          title: target.title,
          templateId: target.templateId,
        }
      });
      // Retirer du targetSlotsMap pour ne pas le recréer
      targetSlotsMap.delete(epSlotKey);
    } else {
      // ANCIEN CRÉNEAU SUPPRIMÉ OU HORAIRES MODIFIÉS :
      // On retire ce qui n'existe plus dans la nouvelle configuration
      await prisma.planning.delete({
        where: { id: ep.id }
      });
    }
  }

  // 6. Création des nouveaux créneaux restants dans targetSlotsMap
  const newPlanningsToCreate = Array.from(targetSlotsMap.values()).map((ts) => ({
    title: ts.title,
    startTime: ts.startTime,
    endTime: ts.endTime,
    date: ts.date,
    specialEventId: id,
    templateId: ts.templateId,
  }));

  if (newPlanningsToCreate.length > 0) {
    await prisma.planning.createMany({
      data: newPlanningsToCreate,
    });
  }

  // 7. Nettoyer les anciens templates qui ne font plus partie des templates validés
  // (Tous les plannings conservés pointent déjà vers un validTemplateId, donc pas de cascade indésirable)
  await prisma.eventTemplate.deleteMany({
    where: {
      specialEventId: id,
      id: { notIn: validTemplateIds }
    }
  });

  // 8. Nettoyage de sécurité : supprimer tout planning hors de l'intervalle de l'événement
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
  return { success: true, message: "Événement et planning mis à jour" };
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
