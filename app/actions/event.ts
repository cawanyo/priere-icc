// app/actions/events.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { addDays, format, isSameDay } from "date-fns";

async function checkLeader() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session?.user?.id) throw new Error("Non connecté");
  // @ts-ignore
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || (user.role !== "LEADER" && user.role !== "ADMIN")) throw new Error("Accès interdit");
  return user;
}

// --- GESTION DES ÉVÉNEMENTS ---

export async function createSpecialEvent(data: any) {
  await checkLeader();
  
  const { title, description, startDate, endDate, templates } = data;

  // TRI DES TEMPLATES PAR HEURE DE DÉBUT AVANT INSERTION
  const sortedTemplates = [...templates].sort((a: any, b: any) => 
    a.startTime.localeCompare(b.startTime)
  );

  await prisma.specialEvent.create({
    data: {
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      templates: {
        create: sortedTemplates.map((t: any) => ({
          title: t.title,
          startTime: new Date(`1970-01-01T${t.startTime}:00`),
          endTime: new Date(`1970-01-01T${t.endTime}:00`),
        }))
      }
    }
  });

  revalidatePath("/dashboard/leader/events");
  return { success: true, message:'Evenement créé' };
}

export async function getSpecialEvents() {
  await checkLeader();
  const events = await prisma.specialEvent.findMany({
    orderBy: { startDate: 'desc' },
    include: { 
        _count: { select: { plannings: true } },
        templates: true
        }
  });
  return { success: true, data: events };
}

export async function getEventDetails(eventId: string) {
  await checkLeader();
  
  const event = await prisma.specialEvent.findUnique({
    where: { id: eventId },
    include: { 
        // On trie aussi les templates à la récupération pour être sûr
        templates: { orderBy: { startTime: 'asc' } } 
    }
  });

  if (!event) return { success: false, error: "Événement introuvable" };

  const realPlannings = await prisma.planning.findMany({
    where: { specialEventId: eventId },
    include: { intercessors: { select: { id: true, name: true, image: true } } }
  });

  // GÉNÉRATION DU CALENDRIER
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
        allSlots.push({ ...real, isVirtual: false, templateId: template.id });
      } else {
        allSlots.push({
          id: `virtual-${template.id}-${format(current, 'yyyy-MM-dd')}`,
          isVirtual: true,
          title: template.title,
          startTime: slotStart,
          endTime: slotEnd,
          intercessors: [],
          specialEventId: event.id
        });
      }
    }
    current = addDays(current, 1);
  }

  // TRI FINAL DU CALENDRIER COMPLET (Par date ET par heure)
  allSlots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return { success: true, event, calendar: allSlots };
}



export async function updateSpecialEvent(data: any) {
  await checkLeader();
  
  const { id, title, description, startDate, endDate, templates } = data;

  // Tri des templates par heure
  const sortedTemplates = [...templates].sort((a: any, b: any) => 
    a.startTime.localeCompare(b.startTime)
  );

  // On utilise une transaction pour garantir l'intégrité
  await prisma.$transaction(async (tx) => {
    // 1. Mettre à jour les infos de l'événement
    await tx.specialEvent.update({
      where: { id },
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      }
    });

    // 2. Remplacer les templates (Supprimer tout + Créer tout)
    // C'est la méthode la plus propre pour gérer les ajouts/suppressions/modifs multiples
    await tx.eventTemplate.deleteMany({
      where: { specialEventId: id }
    });

    if (sortedTemplates.length > 0) {
      await tx.eventTemplate.createMany({
        data: sortedTemplates.map((t: any) => ({
          specialEventId: id,
          title: t.title,
          startTime: new Date(`1970-01-01T${t.startTime}:00`),
          endTime: new Date(`1970-01-01T${t.endTime}:00`),
        }))
      });
    }
  });

  revalidatePath("/dashboard/leader/events");
  return { success: true, message: "Événement mis à jour" };
}

export async function deleteSpecialEvent(id: string) {
  await checkLeader();
  try {
    await prisma.specialEvent.delete({ where: { id } });
    revalidatePath("/dashboard/leader/events");
    return { success: true, message: "Événement supprimé" };
  } catch (error) {
    return { success: false, message: "Erreur lors de la suppression" };
  }
}