"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Clock, ArrowDownAZ, Loader2, Calendar as CalendarIcon, Check } from "lucide-react";
import { createSpecialEvent, updateSpecialEvent } from "@/app/actions/event";
import { toast } from "sonner";
import { SpecialEventWithTemplate } from "@/lib/types";
import { convertKeepDate } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";

export type Template = {
  title: string;
  startTime: string;
  endTime: string;
  id?: string;
  daysMode?: "ALL" | "WEEK_DAYS" | "SPECIFIC_DATES";
  daysOfWeek?: number[];
  specificDates?: string[];
};

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: SpecialEventWithTemplate | null;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Lun", full: "Lundi" },
  { value: 2, label: "Mar", full: "Mardi" },
  { value: 3, label: "Mer", full: "Mercredi" },
  { value: 4, label: "Jeu", full: "Jeudi" },
  { value: 5, label: "Ven", full: "Vendredi" },
  { value: 6, label: "Sam", full: "Samedi" },
  { value: 0, label: "Dim", full: "Dimanche" },
];

function EventFormInner({
  eventToEdit,
  onClose,
}: {
  eventToEdit?: SpecialEventWithTemplate | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  // Initialisation directe sans useEffect
  const [formData, setFormData] = useState(() => ({
    title: eventToEdit?.title || "",
    description: eventToEdit?.description || "",
    startDate: eventToEdit ? format(convertKeepDate(eventToEdit.startDate), "yyyy-MM-dd") : "",
    endDate: eventToEdit ? format(convertKeepDate(eventToEdit.endDate), "yyyy-MM-dd") : "",
  }));

  const [templates, setTemplates] = useState<Template[]>(() => {
    if (eventToEdit?.eventTemplates && eventToEdit.eventTemplates.length > 0) {
      return eventToEdit.eventTemplates.map((t) => ({
        title: t.title,
        startTime: t.startTime,
        endTime: t.endTime,
        id: t.id,
        daysMode: (t.daysMode as "ALL" | "WEEK_DAYS" | "SPECIFIC_DATES") || "ALL",
        daysOfWeek: t.daysOfWeek || [],
        specificDates: t.specificDates || [],
      }));
    }
    return [
      {
        title: "Session de prière",
        startTime: "19:00",
        endTime: "20:30",
        daysMode: "ALL",
        daysOfWeek: [],
        specificDates: [],
      },
    ];
  });

  // Calcul dynamique de toutes les dates de la période de l'événement
  const eventDates = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return [];
    const partsStart = formData.startDate.split("-").map(Number);
    const partsEnd = formData.endDate.split("-").map(Number);
    if (partsStart.length !== 3 || partsEnd.length !== 3) return [];

    const start = new Date(partsStart[0], partsStart[1] - 1, partsStart[2], 12, 0, 0);
    const end = new Date(partsEnd[0], partsEnd[1] - 1, partsEnd[2], 12, 0, 0);
    if (start > end) return [];

    const dates: { dateStr: string; label: string; dayOfWeek: number }[] = [];
    let cur = start;
    while (cur <= end) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, "0");
      const d = String(cur.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      dates.push({
        dateStr,
        label: format(cur, "EEE d MMM", { locale: fr }),
        dayOfWeek: cur.getDay(),
      });
      cur = addDays(cur, 1);
    }
    return dates;
  }, [formData.startDate, formData.endDate]);

  // --- GESTION DES TEMPLATES ---
  const addTemplate = () => {
    setTemplates([
      ...templates,
      {
        title: "",
        startTime: "",
        endTime: "",
        daysMode: "ALL",
        daysOfWeek: [],
        specificDates: [],
      },
    ]);
  };

  const removeTemplate = (i: number) => {
    if (templates.length > 1) {
      setTemplates(templates.filter((_, idx) => idx !== i));
    } else {
      toast.error("Un créneau minimum requis");
    }
  };

  const updateTemplateField = <K extends keyof Template>(
    i: number,
    field: K,
    val: Template[K]
  ) => {
    const newT = [...templates];
    newT[i] = { ...newT[i], [field]: val };
    setTemplates(newT);
  };

  const toggleDayOfWeek = (i: number, dayValue: number) => {
    const currentDays = templates[i].daysOfWeek || [];
    const nextDays = currentDays.includes(dayValue)
      ? currentDays.filter((d) => d !== dayValue)
      : [...currentDays, dayValue].sort();
    updateTemplateField(i, "daysOfWeek", nextDays);
  };

  const toggleSpecificDate = (i: number, dateStr: string) => {
    const currentDates = templates[i].specificDates || [];
    const nextDates = currentDates.includes(dateStr)
      ? currentDates.filter((d) => d !== dateStr)
      : [...currentDates, dateStr];
    updateTemplateField(i, "specificDates", nextDates);
  };

  const selectAllDates = (i: number) => {
    const allDateStrs = eventDates.map((d) => d.dateStr);
    updateTemplateField(i, "specificDates", allDateStrs);
  };

  const clearAllDates = (i: number) => {
    updateTemplateField(i, "specificDates", []);
  };

  const sortTemplates = () => {
    setTemplates([...templates].sort((a, b) => a.startTime.localeCompare(b.startTime)));
    toast.success("Créneaux triés par heure de début !");
  };

  // --- SOUMISSION ---
  const handleSubmit = async () => {
    if (!formData.title || !formData.startDate || !formData.endDate) {
      toast.error("Veuillez remplir les informations générales.");
      return;
    }

    if (formData.startDate > formData.endDate) {
      toast.error("La date de fin doit être postérieure à la date de début.");
      return;
    }

    for (let i = 0; i < templates.length; i++) {
      const t = templates[i];
      const slotName = t.title ? `"${t.title}"` : `créneau ${i + 1}`;
      if (!t.startTime || !t.endTime) {
        toast.error(`Veuillez renseigner les horaires pour le ${slotName}.`);
        return;
      }
      if (t.daysMode === "WEEK_DAYS" && (!t.daysOfWeek || t.daysOfWeek.length === 0)) {
        toast.error(`Veuillez sélectionner au moins un jour pour le ${slotName}.`);
        return;
      }
      if (t.daysMode === "SPECIFIC_DATES" && (!t.specificDates || t.specificDates.length === 0)) {
        toast.error(`Veuillez sélectionner au moins une date pour le ${slotName}.`);
        return;
      }
    }

    setLoading(true);

    let res;
    if (eventToEdit) {
      res = await updateSpecialEvent({
        id: eventToEdit.id,
        ...formData,
        templates,
      });
    } else {
      res = await createSpecialEvent({
        ...formData,
        templates,
      });
    }

    setLoading(false);

    if (res.success) {
      toast.success(eventToEdit ? "Événement modifié" : "Événement créé");
      onClose();
    } else {
      toast.error("Erreur : " + res.message);
    }
  };

  return (
    <>
      <DialogHeader className="p-6 pb-3 border-b">
        <DialogTitle className="text-xl text-indigo-900 font-serif">
          {eventToEdit ? "Modifier l'événement spécial" : "Nouvel Événement Spécial"}
        </DialogTitle>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {/* Infos Générales */}
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="event-title" className="font-semibold text-gray-700">
              Nom de l&apos;événement <span className="text-red-500">*</span>
            </Label>
            <Input
              id="event-title"
              placeholder="Ex: 21 Jours de Jeûne et Prière"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="event-description" className="font-semibold text-gray-700">
              Description (facultative)
            </Label>
            <Textarea
              id="event-description"
              placeholder="Précisions sur le programme, thématiques ou consignes..."
              className="min-h-16"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="event-start-date" className="font-semibold text-gray-700">
                Date de début <span className="text-red-500">*</span>
              </Label>
              <Input
                id="event-start-date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-end-date" className="font-semibold text-gray-700">
                Date de fin <span className="text-red-500">*</span>
              </Label>
              <Input
                id="event-end-date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Créneaux */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Créneaux de l&apos;événement
              </h4>
              <p className="text-xs text-gray-500">
                Définissez les horaires et la fréquence (tous les jours ou certains jours).
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={sortTemplates}
                className="h-8 text-xs"
              >
                <ArrowDownAZ className="h-3.5 w-3.5 mr-1" /> Trier
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={addTemplate}
                className="text-indigo-600 hover:bg-indigo-50 border-indigo-200 h-8 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter un créneau
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {templates.map((t, index) => {
              const mode = t.daysMode || "ALL";

              return (
                <div
                  key={index}
                  className="flex flex-col gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50/70 hover:border-indigo-300 transition-all shadow-2xs"
                >
                  {/* Ligne 1: Titre et suppression */}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Nom du créneau (ex: Prière du matin, Intercession midi...)"
                      className="h-9 bg-white flex-1 font-medium text-sm"
                      value={t.title}
                      onChange={(e) => updateTemplateField(index, "title", e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="h-9 w-9 text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                      onClick={() => removeTemplate(index)}
                      title="Supprimer ce créneau"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Ligne 2: Horaires */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        type="time"
                        className="h-8 pl-8 bg-white text-xs"
                        value={t.startTime}
                        onChange={(e) => updateTemplateField(index, "startTime", e.target.value)}
                      />
                    </div>
                    <span className="text-gray-400 text-xs font-semibold">à</span>
                    <div className="relative flex-1">
                      <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        type="time"
                        className="h-8 pl-8 bg-white text-xs"
                        value={t.endTime}
                        onChange={(e) => updateTemplateField(index, "endTime", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Ligne 3: Configuration de la fréquence / Jours */}
                  <div className="pt-2 border-t border-gray-200/80 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                        Application du créneau
                      </span>

                      {/* Sélecteur de mode (Pills) */}
                      <div className="inline-flex rounded-lg bg-gray-200/80 p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => updateTemplateField(index, "daysMode", "ALL")}
                          className={`px-2.5 py-1 rounded-md transition-all font-medium text-[11px] ${
                            mode === "ALL"
                              ? "bg-white text-indigo-900 shadow-xs"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          Tous les jours
                        </button>
                        <button
                          type="button"
                          onClick={() => updateTemplateField(index, "daysMode", "WEEK_DAYS")}
                          className={`px-2.5 py-1 rounded-md transition-all font-medium text-[11px] ${
                            mode === "WEEK_DAYS"
                              ? "bg-white text-indigo-900 shadow-xs"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          Jours de semaine
                        </button>
                        <button
                          type="button"
                          onClick={() => updateTemplateField(index, "daysMode", "SPECIFIC_DATES")}
                          className={`px-2.5 py-1 rounded-md transition-all font-medium text-[11px] ${
                            mode === "SPECIFIC_DATES"
                              ? "bg-white text-indigo-900 shadow-xs"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          Dates précises
                        </button>
                      </div>
                    </div>

                    {/* Vue 1: Tous les jours */}
                    {mode === "ALL" && (
                      <p className="text-xs text-gray-500 italic bg-white/70 px-2.5 py-1.5 rounded border border-gray-100 flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        Ce créneau sera planifié tous les jours de l&apos;événement.
                      </p>
                    )}

                    {/* Vue 2: Jours de la semaine */}
                    {mode === "WEEK_DAYS" && (
                      <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 font-medium">Jours récurrents :</span>
                          <div className="flex gap-1.5 text-[11px]">
                            <button
                              type="button"
                              onClick={() => updateTemplateField(index, "daysOfWeek", [1, 2, 3, 4, 5])}
                              className="text-indigo-600 hover:underline font-medium"
                            >
                              Lun-Ven
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              type="button"
                              onClick={() => updateTemplateField(index, "daysOfWeek", [6, 0])}
                              className="text-indigo-600 hover:underline font-medium"
                            >
                              Week-end
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              type="button"
                              onClick={() => updateTemplateField(index, "daysOfWeek", [1, 2, 3, 4, 5, 6, 0])}
                              className="text-indigo-600 hover:underline font-medium"
                            >
                              Tous
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1.5">
                          {DAYS_OF_WEEK.map((day) => {
                            const isSelected = (t.daysOfWeek || []).includes(day.value);
                            return (
                              <button
                                key={day.value}
                                type="button"
                                onClick={() => toggleDayOfWeek(index, day.value)}
                                className={`py-1.5 rounded-md text-xs font-semibold border text-center transition-all ${
                                  isSelected
                                    ? "bg-indigo-900 border-indigo-900 text-white shadow-xs"
                                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                }`}
                                title={day.full}
                              >
                                {day.label}
                              </button>
                            );
                          })}
                        </div>

                        {(t.daysOfWeek || []).length === 0 ? (
                          <p className="text-[11px] text-amber-600 font-medium">
                            ⚠ Veuillez sélectionner au moins un jour de la semaine.
                          </p>
                        ) : (
                          <p className="text-[11px] text-gray-500">
                            Sélectionné(s) :{" "}
                            {DAYS_OF_WEEK.filter((d) => (t.daysOfWeek || []).includes(d.value))
                              .map((d) => d.full)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Vue 3: Dates spécifiques */}
                    {mode === "SPECIFIC_DATES" && (
                      <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-200">
                        {!formData.startDate || !formData.endDate ? (
                          <p className="text-xs text-amber-600">
                            Veuillez d&apos;abord renseigner la date de début et de fin de l&apos;événement ci-dessus.
                          </p>
                        ) : eventDates.length === 0 ? (
                          <p className="text-xs text-red-500">
                            La période sélectionnée est invalide (la date de début doit précéder la fin).
                          </p>
                        ) : (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 font-medium flex items-center gap-1">
                                <CalendarIcon className="h-3.5 w-3.5 text-indigo-600" />
                                {(t.specificDates || []).length} / {eventDates.length} date(s) choisie(s)
                              </span>
                              <div className="flex gap-2 text-[11px]">
                                <button
                                  type="button"
                                  onClick={() => selectAllDates(index)}
                                  className="text-indigo-600 hover:underline font-medium"
                                >
                                  Tout cocher
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                  type="button"
                                  onClick={() => clearAllDates(index)}
                                  className="text-gray-500 hover:underline"
                                >
                                  Décocher tout
                                </button>
                              </div>
                            </div>

                            <div className="max-h-36 overflow-y-auto p-2 bg-gray-50/80 rounded-md border border-gray-200 flex flex-wrap gap-1.5">
                              {eventDates.map((d) => {
                                const isSelected = (t.specificDates || []).includes(d.dateStr);
                                return (
                                  <button
                                    key={d.dateStr}
                                    type="button"
                                    onClick={() => toggleSpecificDate(index, d.dateStr)}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                                      isSelected
                                        ? "bg-indigo-700 border-indigo-700 text-white shadow-xs"
                                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                                    }`}
                                  >
                                    {d.label}
                                  </button>
                                );
                              })}
                            </div>

                            {(t.specificDates || []).length === 0 && (
                              <p className="text-[11px] text-amber-600 font-medium">
                                ⚠ Veuillez sélectionner au moins une date.
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <DialogFooter className="p-6 pt-3 border-t mt-auto">
        <Button variant="outline" type="button" onClick={onClose}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-indigo-900 hover:bg-indigo-800"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : eventToEdit ? (
            "Enregistrer les modifications"
          ) : (
            "Créer l'événement"
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

export function EventFormModal({ isOpen, onClose, eventToEdit }: EventFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        {isOpen && (
          <EventFormInner
            key={eventToEdit ? eventToEdit.id : "new-event"}
            eventToEdit={eventToEdit}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
