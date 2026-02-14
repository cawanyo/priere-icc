"use server";

import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";
import { addDays, startOfDay, endOfDay, format } from "date-fns";
import { fr } from "date-fns/locale";

export async function sendSpecialEventReminders() {
  // 1. Définir "Demain"
  const tomorrow = addDays(new Date(), 0);
  
  try {
    const events = await prisma.specialEvent.findMany({
      where: {
        startDate: {
          lte: endOfDay(tomorrow),
        },
        endDate: {
          gte: startOfDay(tomorrow),
        },
      },
      include: {
        plannings: {
            where: {
                date: {
                    gte: startOfDay(tomorrow),
                    lte: endOfDay(tomorrow),
                }
            },
          include: {
            intercessors: true,
            },
          },
        },
      },
    );
    if (events.length === 0) return { success: true, count: 0, message: "Aucun événement demain" };

    let smsCount = 0;
    const promises = [];

    // // 3. Boucle sur les événements
    for (const event of events) {
        for (const planning of event.plannings) {
        
            const participants = planning.intercessors;
            for (const user of participants) {
                if (!user.phone) continue;
                const teammates = participants.filter((p) => p.id !== user.id);
                let message = `Bonjour ${user.name}, rappel pour l'événement "${event.title}" du ${format(planning.date, "EEEE dd MMMM yyyy", { locale: fr })} à ${planning.startTime}.`;

          if (teammates.length > 0) {
            if (teammates.length === 1) {
                message += ` Tu seras en binôme avec ${teammates[0].name}.`;
            } 
            else {
                const names = teammates.slice(0, 2).map(t => t.name).join(", ");
                const othersCount = teammates.length - 2;
                
                if (othersCount > 0) {
                    message += ` Tu seras en équipe avec ${names} et ${othersCount} autre(s).`;
                } else {
                    message += ` Tu seras en équipe avec ${names}.`;
                }
            }
          } 

          // Ajout à la file d'envoi
          console.log(`SMS Event -> ${user.name}: ${message}`);
          promises.push(sendSMS({to:user.phone, message}));
          smsCount++;
            }
          }
       }
    }

    // 5. Tout envoyer
//     
    catch (error) {
    console.error("Erreur SMS Event:", error);
    return { success: false, error: "Erreur envoi" };
  }
}

sendSpecialEventReminders()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });