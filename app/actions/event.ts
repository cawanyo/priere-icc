// app/actions/events.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { addDays, format, isSameDay } from "date-fns";
import { SpecialEventWithPlaning, SpecialEventWithTemplate, TemplatePrisma } from "@/lib/types";
import { Template } from "@/components/dashboard/event/EventFormModal";
import { SpecialEvent } from "@prisma/client";

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

export async function createPlaningForEvent(event:SpecialEvent, templates:TemplatePrisma[], start: Date, end:Date ) {
  let current = start;
    
    const records: any[] = [];
    
    while (current <= end) {
      for (const t of templates) {
        records.push({
          title: t.title,
          startTime: t.startTime,
          endTime: t.endTime,
          date: current,
          specialEventId: event.id,
          templateId: t.id
        });
      }
      current = addDays(current, 1);
    }
    
    // Create all records in one efficient batch
    if (records.length > 0) {
      await prisma.planning.createMany({
        data: records,
      });}
    
}

export async function updateTemplate(event:SpecialEvent, template:TemplatePrisma){

  const t = await prisma.eventTemplate.update({
    where: {id: template.id},
    data: {
      title: template.title,
      startTime: template.startTime,
      endTime: template.endTime
    }
  })

  await prisma.planning.updateMany({
    where: {
      templateId: t.id
    },
    data: {
      startTime: template.startTime,
      endTime: template.endTime,
      title: template.title
    }
  })
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
    },
    include:{templates:true}
  });
  if(!event){
    return { success: false, message:'Evenement non créé' };
  }

  await createPlaningForEvent(event, event.templates, event.startDate, event.endDate)
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

    // 1. Mettre à jour les infos de l'événement
    const oldEvent = await prisma.specialEvent.findFirst({
      where: {id},
    });

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
    const templateIds = templates.map((t: any) => t.id).filter((id:any) => id);

    // 2. Delete templates that has been removed 
    await prisma.eventTemplate.deleteMany({
      where: {
        specialEventId: id,
        id: { notIn: templateIds }
      },
    });

    await prisma.planning.deleteMany({
      where: {
        specialEventId: id,
        templateId: { notIn: templateIds}
      },
    })

    const newTemplates = []
    for( const t of templates){
      const exist = await prisma.eventTemplate.findFirst({where: {id:t.id ?? ""}})
      if (exist) 
        await updateTemplate(event, t);
      else {
        const templateCreated = await prisma.eventTemplate.create({
          data: {
            startTime: t.startTime,
            endTime: t.endTime,
            title: t.title,
            specialEventId: event.id
          }     
        });
          newTemplates.push(t)
        }
      }  
    await createPlaningForEvent(event, newTemplates, event.startDate, event.endDate)
  

    await prisma.planning.deleteMany({
      where: {
        specialEventId: event.id,
        OR: [
          { date: { lt: event.startDate } },
          { date: { gt: event.endDate } }
        ]
      }
    })
    
    const newEvent = await prisma.specialEvent.findFirst({
      where: {id},
      include: { templates: true}
    });



    if(newEvent && oldEvent){
      await createPlaningForEvent(event, newEvent.templates, newEvent?.startDate, addDays(oldEvent.startDate, -1))
      await createPlaningForEvent(event, newEvent.templates,  addDays(oldEvent.endDate, 1), newEvent.endDate)
    }

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