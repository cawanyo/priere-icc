import { prisma } from "@/lib/prisma";
import { PlaningWithIntercessor } from "@/lib/types";
import { getDay, format, startOfWeek, endOfWeek, addDays, startOfDay, endOfDay } from "date-fns";

/**
 * Projette les modèles récurrents (RecurringSchedule) sur une plage de dates demandée,
 * sous forme de créneaux virtuels (isVirtual: true) avec des pointillés autour,
 * SANS les insérer en base de données à l'avance.
 * Dès qu'un créneau réel est enregistré pour ce jour et cette récurrence, le créneau réel prime.
 */
export async function projectRecurringSlots(
  startDate: Date,
  endDate: Date,
  realPlannings: PlaningWithIntercessor[]
): Promise<PlaningWithIntercessor[]> {
  try {
    const recurringSchedules = await prisma.recurringSchedule.findMany();
    if (recurringSchedules.length === 0) {
      return realPlannings;
    }

    const start = startOfWeek(new Date(startDate), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(endDate), { weekStartsOn: 1 });

    const virtualSlots: PlaningWithIntercessor[] = [];
    let current = startOfDay(start);
    const endLimit = endOfDay(end);

    while (current <= endLimit) {
      const dayIndex = getDay(current); // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
      const matchingSchedules = recurringSchedules.filter((s) => s.dayOfWeek === dayIndex);

      if (matchingSchedules.length > 0) {
        const dateStr = format(current, "yyyy-MM-dd");
        const slotDateIso = `${dateStr}T00:00:00.000Z`;

        for (const schedule of matchingSchedules) {
          // Vérifier si un créneau RÉEL existe déjà ce jour-là pour cette récurrence
          const realExists = realPlannings.some((p) => {
            const pDateStr = p.date instanceof Date ? format(p.date, "yyyy-MM-dd") : String(p.date).slice(0, 10);
            if (pDateStr !== dateStr) return false;
            return (
              p.recurringId === schedule.id ||
              (p.startTime === schedule.startTime && p.endTime === schedule.endTime)
            );
          });

          // S'il n'y a pas encore de créneau réel, projeter le modèle récurrent virtuel
          if (!realExists) {
            virtualSlots.push({
              id: `virtual-${schedule.id}-${dateStr}`,
              title: schedule.title,
              description: schedule.description || null,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              recurringId: schedule.id,
              specialEventId: null,
              templateId: null,
              date: new Date(slotDateIso),
              createdAt: new Date(),
              updatedAt: new Date(),
              isVirtual: true,
              users: [],
            });
          }
        }
      }

      current = addDays(current, 1);
    }

    // Fusionner les créneaux réels et les projections virtuelles, puis trier par heure de début
    const allSlots = [...realPlannings, ...virtualSlots];
    return allSlots.sort((a, b) => (a.startTime || "00:00").localeCompare(b.startTime || "00:00"));
  } catch (error) {
    console.error("[projectRecurringSlots] Erreur projection récurrences:", error);
    return realPlannings;
  }
}
