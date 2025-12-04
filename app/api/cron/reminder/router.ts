import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";
import { addDays, startOfDay, endOfDay, format } from "date-fns";
import { fr } from "date-fns/locale";

// Cette route doit être protégée pour ne pas être appelée par n'importe qui
// Vercel ajoute un header d'authentification spécial pour les Crons
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  
  // Sécurité simple : Vérifier si la requête vient bien du Cron Vercel (en prod)
  // En dev, on peut bypasser ou utiliser un secret dans l'URL
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 1. Définir la plage de "Demain"
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const startOfTomorrow = startOfDay(tomorrow);
    const endOfTomorrow = endOfDay(tomorrow);

    console.log(`[CRON] Lancement des rappels pour le ${format(tomorrow, "dd/MM/yyyy")}`);

    // 2. Récupérer les événements de demain avec les intercesseurs
    const events = await prisma.planning.findMany({
      where: {
        startTime: {
          gte: startOfTomorrow,
          lte: endOfTomorrow
        }
      },
      include: {
        intercessors: {
          select: { id: true, name: true, phone: true }
        }
      }
    });

    let smsCount = 0;

    // 3. Boucler et envoyer
    for (const event of events) {
      const timeStr = format(new Date(event.startTime), "HH'h'mm");
      
      for (const user of event.intercessors) {
        if (user.phone) {
          const message = `Rappel : Bonjour ${user.name}, vous êtes programmé demain à ${timeStr} pour "${event.title}". Merci de votre service !`;
          
          await sendSMS(user.phone, message);
          smsCount++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      eventsFound: events.length, 
      smsSent: smsCount 
    });

  } catch (error) {
    console.error("[CRON ERROR]", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}