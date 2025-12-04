// app/actions/events.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { addDays, format, isSameDay } from "date-fns";
import { SpecialEventWithPlaning } from "@/lib/types";

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

export async function createPlaningForEvent({event, templates}: {event:any, templates:any}) {
  let current = event.startDate;
    const end = event.endDate;
    
    const records: any[] = [];
    
    while (current <= end) {
      for (const t of templates) {
        records.push({
          title: t.title,
          startTime: t.startTime,
          endTime: t.endTime,
          date: current,
          specialEventId: event.id,
        });
      }
      current = addDays(current, 1);
    }
    
    // Create all records in one efficient batch
    await prisma.planning.createMany({
      data: records,
    });
    
}

export async function createSpecialEvent(data: any) {
  await checkLeader();
  
  const { title, description, startDate, endDate, templates } = data;

  // TRI DES TEMPLATES PAR HEURE DE DÉBUT AVANT INSERTION
  const sortedTemplates = [...templates].sort((a: any, b: any) => 
    a.startTime.localeCompare(b.startTime)
  );

  const event = await prisma.specialEvent.create({
    data: {
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      templates: {
        create: sortedTemplates.map((t: any) => ({
          title: t.title,
          startTime: t.startTime,
          endTime: t.endTime,
        }))
      }
    }
  });
  if(event){
    createPlaningForEvent({event, templates})
    
  }

  revalidatePath("/dashboard/leader/events");
  return { success: true, message:'Evenement créé' };
}

export async function getSpecialEvents() {
  await checkLeader();
  const events = await prisma.specialEvent.findMany({
    orderBy: { startDate: 'desc' },
    include: { 
        templates: true,
        }
  });
  return { success: true, data: events };
}

export async function getEventDetails(eventId: string) {
  await checkLeader();
  
  const event: SpecialEventWithPlaning | null = await prisma.specialEvent.findUnique({
    where: { id: eventId },
    include: { 
        // On trie aussi les templates à la récupération pour être sûr
        plannings: {include: {intercessors: true}}

      } 
    
  });
  if (!event) return { success: false, error: "Événement introuvable" };
  return { success: true, event};
}



export async function updateSpecialEvent(data: any) {
  await checkLeader();
  
  const { id, title, description, startDate, endDate, templates } = data;

  const sortedTemplates = [...templates].sort((a: any, b: any) => 
    a.startTime.localeCompare(b.startTime)
  );


    // 1. Mettre à jour les infos de l'événement
    const event = await prisma.specialEvent.update({
      where: { id },
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      }
    });

    // update templates
    await prisma.eventTemplate.deleteMany({
      where: { specialEventId: id }
    });

    if (sortedTemplates.length > 0) {
      await prisma.eventTemplate.createMany({
        data: sortedTemplates.map((t: any) => ({
          specialEventId: id,
          title: t.title,
          startTime: t.startTime,
          endTime: t.endTime,
        }))
      });
    }

    //update planings
    await prisma.planning.deleteMany({
      where: {specialEventId: id}
    })

    createPlaningForEvent({event, templates} )
  

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