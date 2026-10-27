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
