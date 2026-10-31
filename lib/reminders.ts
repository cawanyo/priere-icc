import { prisma } from "@/lib/prisma";
import { createNotification } from "@/app/actions/notifications";

export interface ReminderDetail {
  userId: string;
  userName: string;
  type: "REMINDER_EVE" | "REMINDER_1H";
  slotType: "PLANNING" | "PRAYER_HOUSE";
  slotTime: string;
  slotDate: string;
  title: string;
}

export interface ReminderStats {
  timestamp: string;
  parisTime: string;
  parisHour: number;
  eveRemindersSent: number;
  oneHourRemindersSent: number;
  details: ReminderDetail[];
}

/**
 * Calcule les composantes de date et d'heure dans le fuseau horaire de l'église (Europe/Paris)
 */
export function getParisTimeComponents(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const p of parts) partMap[p.type] = p.value;

  const year = parseInt(partMap.year, 10);
  const month = parseInt(partMap.month, 10) - 1; // 0-indexé
  const day = parseInt(partMap.day, 10);
  const hour = parseInt(partMap.hour, 10);
  const minute = parseInt(partMap.minute, 10);

  // Début et fin du jour J (aujourd'hui) en UTC
  const todayStart = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  const todayEnd = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

  // Début et fin de demain en UTC
  const tomorrowStart = new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0));
  const tomorrowEnd = new Date(Date.UTC(year, month, day + 1, 23, 59, 59, 999));

  return {
    year,
    month,
    day,
    hour,
    minute,
    todayStart,
    todayEnd,
    tomorrowStart,
    tomorrowEnd,
    parisTimeString: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

/**
 * Détermine la date/heure absolue d'un créneau dans le fuseau Europe/Paris
 */
export function getSlotAbsoluteDateTime(slotDate: Date, startTime: string): Date {
  const [hours, minutes] = startTime.split(":").map(Number);

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateStr = formatter.format(slotDate); // "YYYY-MM-DD"

  // Calcul du décalage horaire dynamique de Paris à cette date (gère automatiquement heure d'hiver/été)
  const probe = new Date(`${dateStr}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    timeZoneName: "shortOffset",
  }).formatToParts(probe);
  const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value || "GMT+1";
  const offsetHours = offsetPart.replace("GMT", "").trim() || "+1";
  const sign = offsetHours.startsWith("-") ? "-" : "+";
  const num = Math.abs(parseInt(offsetHours, 10));
  const offsetStr = `${sign}${String(num).padStart(2, "0")}:00`;

  return new Date(
    `${dateStr}T${String(hours || 0).padStart(2, "0")}:${String(minutes || 0).padStart(2, "0")}:00${offsetStr}`
  );
}

/**
 * Traite et envoie tous les rappels programmés :
 * 1. La veille à 18h (pour les créneaux du lendemain dans Planning et Maison de Prière)
 * 2. À 1h du créneau (pour les créneaux débutant dans ~1h)
 */
export async function sendScheduledReminders(options?: {
  forceEve?: boolean;
  force1h?: boolean;
}): Promise<ReminderStats> {
  const now = new Date();
  const paris = getParisTimeComponents(now);

  const stats: ReminderStats = {
    timestamp: now.toISOString(),
    parisTime: paris.parisTimeString,
    parisHour: paris.hour,
    eveRemindersSent: 0,
    oneHourRemindersSent: 0,
    details: [],
  };

  // -------------------------------------------------------------
  // 1. RAPPEL LA VEILLE À 18H (Actif dès 18h00 heure de Paris)
  // -------------------------------------------------------------
  const isEveTime = paris.hour >= 18 || options?.forceEve;

  if (isEveTime) {
    // 1.A Planning de prière pour demain
    const tomorrowPlannings = await prisma.planning.findMany({
      where: {
        date: { gte: paris.tomorrowStart, lte: paris.tomorrowEnd },
      },
      include: {
        users: { select: { id: true, name: true } },
      },
    });

    for (const slot of tomorrowPlannings) {
      for (const user of slot.users) {
        const link = `/dashboard/desktop/planning?slotId=${slot.id}`;
        
        // Déduplication : vérifier si ce rappel de la veille a déjà été envoyé pour ce créneau
        const alreadySent = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            type: "REMINDER_EVE",
            link: { contains: slot.id },
          },
        });

        if (!alreadySent) {
          const firstName = user.name?.trim().split(" ")[0] || "Bien-aimé(e)";
          const titleText = slot.title ? ` pour "${slot.title}"` : "";
          
          await createNotification(
            user.id,
            "Rappel : Prière demain 🕊️",
            `Bonjour ${firstName}, vous êtes programmé(e) demain à ${slot.startTime}${titleText}. Bon temps d'intercession !`,
            "REMINDER_EVE",
            link
          );

          stats.eveRemindersSent++;
          stats.details.push({
            userId: user.id,
            userName: user.name || "Inconnu",
            type: "REMINDER_EVE",
            slotType: "PLANNING",
            slotTime: slot.startTime,
            slotDate: slot.date.toISOString().slice(0, 10),
            title: slot.title || "Planning",
          });
        }
      }
    }

    // 1.B Maison de prière (gardes de nuit) pour demain
    const tomorrowFamilySchedules = await prisma.familySchedule.findMany({
      where: {
        date: { gte: paris.tomorrowStart, lte: paris.tomorrowEnd },
        userId: { not: null },
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    for (const schedule of tomorrowFamilySchedules) {
      if (!schedule.user || !schedule.userId) continue;

      const link = `/dashboard/desktop/prayer-house?slotId=${schedule.id}`;
      
      const alreadySent = await prisma.notification.findFirst({
        where: {
          userId: schedule.userId,
          type: "REMINDER_EVE",
          link: { contains: schedule.id },
        },
      });

      if (!alreadySent) {
        const firstName = schedule.user.name?.trim().split(" ")[0] || "Sentinelle";
        
        await createNotification(
          schedule.userId,
          "Rappel : Veille de nuit demain 🕊️",
          `Bonjour ${firstName}, vous êtes de garde demain à ${schedule.startTime} pour la Maison de Prière. Que le Seigneur vous fortifie !`,
          "REMINDER_EVE",
          link
        );

        stats.eveRemindersSent++;
        stats.details.push({
          userId: schedule.userId,
          userName: schedule.user.name || "Inconnu",
          type: "REMINDER_EVE",
          slotType: "PRAYER_HOUSE",
          slotTime: schedule.startTime,
          slotDate: schedule.date.toISOString().slice(0, 10),
          title: "Maison de Prière",
        });
      }
    }
  }

  // -------------------------------------------------------------
  // 2. RAPPEL À 1H DU CRÉNEAU (Entre 15 et 90 minutes avant le début)
  // -------------------------------------------------------------
  // On recherche sur aujourd'hui et demain (pour gérer les créneaux de minuit / nuit)
  const candidatePlannings = await prisma.planning.findMany({
    where: {
      date: { gte: paris.todayStart, lte: paris.tomorrowEnd },
    },
    include: {
      users: { select: { id: true, name: true } },
    },
  });

  for (const slot of candidatePlannings) {
    if (!slot.startTime || slot.users.length === 0) continue;

    const slotDateTime = getSlotAbsoluteDateTime(slot.date, slot.startTime);
    const diffMinutes = Math.round((slotDateTime.getTime() - now.getTime()) / 60000);

    // Si le créneau commence dans la fenêtre des ~1 heure (15 à 90 minutes)
    const isUpcomingInOneHour = (diffMinutes >= 15 && diffMinutes <= 90) || options?.force1h;

    if (isUpcomingInOneHour) {
      for (const user of slot.users) {
        const link = `/dashboard/desktop/planning?slotId=${slot.id}`;

        const alreadySent = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            type: "REMINDER_1H",
            link: { contains: slot.id },
          },
        });

        if (!alreadySent) {
          const firstName = user.name?.trim().split(" ")[0] || "Bien-aimé(e)";
          const titleText = slot.title ? ` pour "${slot.title}"` : "";

          await createNotification(
            user.id,
            "Rappel : Créneau de prière dans 1h ⏳",
            `Bonjour ${firstName}, votre créneau commence dans 1h (à ${slot.startTime})${titleText}. Bon temps dans la présence de Dieu !`,
            "REMINDER_1H",
            link
          );

          stats.oneHourRemindersSent++;
          stats.details.push({
            userId: user.id,
            userName: user.name || "Inconnu",
            type: "REMINDER_1H",
            slotType: "PLANNING",
            slotTime: slot.startTime,
            slotDate: slot.date.toISOString().slice(0, 10),
            title: slot.title || "Planning",
          });
        }
      }
    }
  }

  // 2.B Maison de prière (gardes de nuit débutant dans ~1h)
  const candidateFamilySchedules = await prisma.familySchedule.findMany({
    where: {
      date: { gte: paris.todayStart, lte: paris.tomorrowEnd },
      userId: { not: null },
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  for (const schedule of candidateFamilySchedules) {
    if (!schedule.user || !schedule.userId || !schedule.startTime) continue;

    const slotDateTime = getSlotAbsoluteDateTime(schedule.date, schedule.startTime);
    const diffMinutes = Math.round((slotDateTime.getTime() - now.getTime()) / 60000);

    const isUpcomingInOneHour = (diffMinutes >= 15 && diffMinutes <= 90) || options?.force1h;

    if (isUpcomingInOneHour) {
      const link = `/dashboard/desktop/prayer-house?slotId=${schedule.id}`;

      const alreadySent = await prisma.notification.findFirst({
        where: {
          userId: schedule.userId,
          type: "REMINDER_1H",
          link: { contains: schedule.id },
        },
      });

      if (!alreadySent) {
        const firstName = schedule.user.name?.trim().split(" ")[0] || "Sentinelle";

        await createNotification(
          schedule.userId,
          "Rappel : Veille de nuit dans 1h ⏳",
          `Bonjour ${firstName}, votre temps de veille commence dans 1h (à ${schedule.startTime}). Que le Seigneur vous soutienne !`,
          "REMINDER_1H",
          link
        );

        stats.oneHourRemindersSent++;
        stats.details.push({
          userId: schedule.userId,
          userName: schedule.user.name || "Inconnu",
          type: "REMINDER_1H",
          slotType: "PRAYER_HOUSE",
          slotTime: schedule.startTime,
          slotDate: schedule.date.toISOString().slice(0, 10),
          title: "Maison de Prière",
        });
      }
    }
  }

  return stats;
}

// Mécanisme de déclenchement d'arrière-plan avec limitation pour ne pas surcharger la base
let lastBackgroundCheck = 0;
export async function triggerBackgroundReminderCheck(): Promise<void> {
  const now = Date.now();
  // Limite : maximum un contrôle toutes les 10 minutes
  if (now - lastBackgroundCheck < 10 * 60 * 1000) return;
  lastBackgroundCheck = now;

  sendScheduledReminders().catch((err) => {
    console.warn("[Reminders] Erreur vérification d'arrière-plan:", err);
  });
}
