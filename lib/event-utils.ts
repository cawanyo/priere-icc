export interface SpecialEventTemplateInput {
  id?: string;
  title: string;
  startTime: string;
  endTime: string;
  daysMode?: string;
  daysOfWeek?: number[];
  specificDates?: string[];
}

export interface SpecialEventInput {
  id?: string;
  title: string;
  description?: string;
  startDate: string | Date;
  endDate: string | Date;
  templates: SpecialEventTemplateInput[];
}

// Normalise une date ou chaîne YYYY-MM-DD à minuit UTC pour éviter tout décalage de fuseau horaire
export function parseUtcMidnight(dateInput: string | Date): Date {
  if (typeof dateInput === "string") {
    const datePart = dateInput.split("T")[0];
    const parts = datePart.split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    }
  }
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

// Vérifie si un template de créneau s'applique à une date donnée
export function templateAppliesToDate(
  template: {
    daysMode?: string | null;
    daysOfWeek?: number[] | null;
    specificDates?: string[] | null;
  },
  date: Date
): boolean {
  const mode = template.daysMode || "ALL";
  if (mode === "ALL") return true;

  const dateStr = date.toISOString().slice(0, 10);
  const dayOfWeek = date.getUTCDay(); // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi

  if (mode === "WEEK_DAYS") {
    if (!template.daysOfWeek || template.daysOfWeek.length === 0) return true;
    return template.daysOfWeek.includes(dayOfWeek);
  }

  if (mode === "SPECIFIC_DATES") {
    if (!template.specificDates || template.specificDates.length === 0) return true;
    return template.specificDates.includes(dateStr);
  }

  return true;
}

export interface SliceSlotsOptions {
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  durationMinutes: number; // e.g. 60
  baseTitle?: string;
  daysMode?: "ALL" | "WEEK_DAYS" | "SPECIFIC_DATES";
  daysOfWeek?: number[];
  specificDates?: string[];
}

// Découpe automatiquement une plage horaire [startTime -> endTime] en créneaux d'une durée donnée
export function sliceTimeSlots(options: SliceSlotsOptions): SpecialEventTemplateInput[] {
  const { startTime, endTime, durationMinutes, baseTitle, daysMode, daysOfWeek, specificDates } = options;
  if (!startTime || !endTime || !durationMinutes || durationMinutes <= 0) return [];

  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return [];

  const startTotalMinutes = startH * 60 + startM;
  let endTotalMinutes = endH * 60 + endM;

  // Si l'heure de fin est inférieure ou égale à l'heure de début, on traverse minuit (ex: 22h -> 06h)
  if (endTotalMinutes <= startTotalMinutes) {
    endTotalMinutes += 24 * 60;
  }

  const slots: SpecialEventTemplateInput[] = [];
  let currentMin = startTotalMinutes;

  while (currentMin < endTotalMinutes) {
    const nextMin = Math.min(currentMin + durationMinutes, endTotalMinutes);

    const slotStartH = Math.floor((currentMin % (24 * 60)) / 60);
    const slotStartM = (currentMin % (24 * 60)) % 60;
    const slotEndH = Math.floor((nextMin % (24 * 60)) / 60);
    const slotEndM = (nextMin % (24 * 60)) % 60;

    const formattedStart = `${String(slotStartH).padStart(2, "0")}:${String(slotStartM).padStart(2, "0")}`;
    const formattedEnd = `${String(slotEndH).padStart(2, "0")}:${String(slotEndM).padStart(2, "0")}`;

    const title = baseTitle?.trim()
      ? `${baseTitle.trim()} (${formattedStart} - ${formattedEnd})`
      : `Créneau ${formattedStart} - ${formattedEnd}`;

    slots.push({
      title,
      startTime: formattedStart,
      endTime: formattedEnd,
      daysMode: daysMode || "ALL",
      daysOfWeek: daysOfWeek ? [...daysOfWeek] : [],
      specificDates: specificDates ? [...specificDates] : [],
    });

    currentMin = nextMin;
  }

  return slots;
}

