"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  Clock,
  ChevronLeft,
  ArrowDownAZ,
  Loader2,
  Calendar as CalendarIcon,
  Check,
  Layers,
  Sliders,
} from "lucide-react";
import { createSpecialEvent, updateSpecialEvent } from "@/app/actions/event";
import { toast } from "sonner";
import { SpecialEventWithTemplate } from "@/lib/types";
import { convertKeepDate, cn } from "@/lib/utils";
import { sliceTimeSlots } from "@/lib/event-utils";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

export type Template = {
  title: string;
  startTime: string;
  endTime: string;
  id?: string;
  daysMode?: "ALL" | "WEEK_DAYS" | "SPECIFIC_DATES";
  daysOfWeek?: number[];
  specificDates?: string[];
};

interface EventFormPageProps {
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

const DURATION_PRESETS = [
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 heure", value: 60 },
  { label: "1h30", value: 90 },
  { label: "2 heures", value: 120 },
  { label: "3 heures", value: 180 },
];

export function EventFormPage({ eventToEdit }: EventFormPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [slotMode, setSlotMode] = useState<"AUTO" | "MANUAL">(() =>
    eventToEdit ? "MANUAL" : "AUTO"
  );

  const [formData, setFormData] = useState(() => ({
    title: eventToEdit?.title || "",
    description: eventToEdit?.description || "",
    startDate: eventToEdit ? format(convertKeepDate(eventToEdit.startDate), "yyyy-MM-dd") : "",
    endDate: eventToEdit ? format(convertKeepDate(eventToEdit.endDate), "yyyy-MM-dd") : "",
  }));

  const [autoGen, setAutoGen] = useState({
    startTime: "08:00",
    endTime: "20:00",
    durationPreset: "60",
    customDuration: "60",
    baseTitle: "",
    daysMode: "ALL" as "ALL" | "WEEK_DAYS" | "SPECIFIC_DATES",
    daysOfWeek: [] as number[],
    specificDates: [] as string[],
    replaceExisting: true,
  });

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

  const effectiveDurationMinutes = useMemo(() => {
    if (autoGen.durationPreset === "custom") {
      const val = parseInt(autoGen.customDuration, 10);
      return isNaN(val) || val <= 0 ? 60 : val;
    }
    const val = parseInt(autoGen.durationPreset, 10);
    return isNaN(val) || val <= 0 ? 60 : val;
  }, [autoGen.durationPreset, autoGen.customDuration]);

  const previewSlices = useMemo(() => {
    return sliceTimeSlots({
      startTime: autoGen.startTime,
      endTime: autoGen.endTime,
      durationMinutes: effectiveDurationMinutes,
      baseTitle: autoGen.baseTitle,
      daysMode: autoGen.daysMode,
      daysOfWeek: autoGen.daysOfWeek,
      specificDates: autoGen.specificDates,
    });
  }, [
    autoGen.startTime,
    autoGen.endTime,
    effectiveDurationMinutes,
    autoGen.baseTitle,
    autoGen.daysMode,
    autoGen.daysOfWeek,
    autoGen.specificDates,
  ]);

  const handleApplySlices = () => {
    if (previewSlices.length === 0) {
      toast.error("Veuillez renseigner des horaires valides pour le découpage.");
      return;
    }

    if (autoGen.replaceExisting) {
      setTemplates(
        previewSlices.map((s) => ({
          title: s.title,
          startTime: s.startTime,
          endTime: s.endTime,
          daysMode: (s.daysMode as "ALL" | "WEEK_DAYS" | "SPECIFIC_DATES") || "ALL",
          daysOfWeek: s.daysOfWeek || [],
          specificDates: s.specificDates || [],
        }))
      );
    } else {
      setTemplates([
        ...templates,
        ...previewSlices.map((s) => ({
          title: s.title,
          startTime: s.startTime,
          endTime: s.endTime,
          daysMode: (s.daysMode as "ALL" | "WEEK_DAYS" | "SPECIFIC_DATES") || "ALL",
          daysOfWeek: s.daysOfWeek || [],
          specificDates: s.specificDates || [],
        })),
      ]);
    }

    setSlotMode("MANUAL");
    toast.success(`${previewSlices.length} créneau(x) généré(s) avec succès !`);
  };

  const addTemplate = () => {
    const last = templates[templates.length - 1];
    let nextStart = "20:00";
    let nextEnd = "21:00";
    if (last && last.endTime) {
      nextStart = last.endTime;
      const [h, m] = nextStart.split(":").map(Number);
      nextEnd = `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    setTemplates([
      ...templates,
      {
        title: "",
        startTime: nextStart,
        endTime: nextEnd,
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

  const handleSubmit = async () => {
    if (!formData.title || !formData.startDate || !formData.endDate) {
      toast.error("Veuillez renseigner le nom et les dates de l'événement.");
      return;
    }

    if (formData.startDate > formData.endDate) {
      toast.error("La date de fin doit être postérieure à la date de début.");
      return;
    }

    if (templates.length === 0) {
      toast.error("Veuillez définir au moins un créneau horaire.");
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
      toast.success(eventToEdit ? "Événement mis à jour" : "Événement créé avec succès");
      router.push(eventToEdit ? `/dashboard/leader/events/${eventToEdit.id}` : "/dashboard/leader/events");
      router.refresh();
    } else {
      toast.error("Erreur : " + res.message);
    }
  };

  const backUrl = eventToEdit
    ? `/dashboard/leader/events/${eventToEdit.id}`
    : "/dashboard/leader/events";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* 1. Entête Sobre */}
      <div>
        <Link
          href={backUrl}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1 px-2 -ml-2 rounded-lg"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{eventToEdit ? "Retour aux détails" : "Tous les événements"}</span>
        </Link>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">
              {eventToEdit ? "Modifier l'événement spécial" : "Nouvel événement spécial"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Définissez les dates et configurez les créneaux horaires de service.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push(backUrl)}
              disabled={loading}
              className="text-xs rounded-xl"
            >
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer l'événement"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Carte : Informations Générales */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
          1. Informations générales
        </h2>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-slate-700">
              Nom du programme <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ex: 21 Jours de Jeûne et Prière"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-sm rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-xs font-semibold text-slate-700">
                Date de début <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="text-sm rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate" className="text-xs font-semibold text-slate-700">
                Date de fin <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="text-sm rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-slate-700">
              Description <span className="text-slate-400 font-normal">(optionnel)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Thème, consignes de prière ou détails d'organisation..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="text-sm rounded-xl resize-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Carte : Configuration des Créneaux Horaires */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              2. Configuration des créneaux
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {templates.length} créneau{templates.length > 1 ? "x" : ""} configuré{templates.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSlotMode("AUTO")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                slotMode === "AUTO"
                  ? "bg-white text-indigo-950 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              Génération auto
            </button>
            <button
              type="button"
              onClick={() => setSlotMode("MANUAL")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                slotMode === "MANUAL"
                  ? "bg-white text-indigo-950 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Sliders className="h-3.5 w-3.5" />
              Saisie manuelle
            </button>
          </div>
        </div>

        {/* Panneau de Découpage Automatique */}
        {slotMode === "AUTO" && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Générateur de créneaux réguliers
              </h3>
              <p className="text-xs text-slate-500">
                Découpez automatiquement une plage horaire en tranches régulières.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">De</Label>
                <Input
                  type="time"
                  value={autoGen.startTime}
                  onChange={(e) => setAutoGen({ ...autoGen, startTime: e.target.value })}
                  className="bg-white rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">À</Label>
                <Input
                  type="time"
                  value={autoGen.endTime}
                  onChange={(e) => setAutoGen({ ...autoGen, endTime: e.target.value })}
                  className="bg-white rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-700">Durée par créneau</Label>
                <select
                  value={autoGen.durationPreset}
                  onChange={(e) => setAutoGen({ ...autoGen, durationPreset: e.target.value })}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:outline-hidden"
                >
                  {DURATION_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-slate-700">
                Titre de base des créneaux (optionnel)
              </Label>
              <Input
                placeholder="Ex: Tour de prière"
                value={autoGen.baseTitle}
                onChange={(e) => setAutoGen({ ...autoGen, baseTitle: e.target.value })}
                className="bg-white rounded-xl text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-600 font-medium">
                {previewSlices.length > 0 ? (
                  <span>
                    Prévisualisation : <strong>{previewSlices.length} créneau(x)</strong> de {autoGen.startTime} à {autoGen.endTime}
                  </span>
                ) : (
                  <span className="text-amber-600">Horaires invalides</span>
                )}
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleApplySlices}
                disabled={previewSlices.length === 0}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold self-start sm:self-auto cursor-pointer"
              >
                Générer les créneaux
              </Button>
            </div>
          </div>
        )}

        {/* Liste des Créneaux Manuels */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Liste détaillée des créneaux
            </span>
            <div className="flex items-center gap-2">
              {templates.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={sortTemplates}
                  className="h-7 text-xs text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                >
                  <ArrowDownAZ className="h-3.5 w-3.5 mr-1" />
                  Trier par heure
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTemplate}
                className="h-7 text-xs rounded-lg cursor-pointer font-medium"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ajouter un créneau
              </Button>
            </div>
          </div>

          <div className="space-y-2.5">
            {templates.map((template, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="h-6 w-6 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <Input
                      placeholder="Titre du créneau (ex: Intercession matinale)"
                      value={template.title}
                      onChange={(e) => updateTemplateField(idx, "title", e.target.value)}
                      className="bg-white text-xs h-8 rounded-lg"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <input
                        type="time"
                        value={template.startTime}
                        onChange={(e) => updateTemplateField(idx, "startTime", e.target.value)}
                        className="text-xs font-mono bg-transparent border-0 p-0 focus:outline-hidden w-14"
                      />
                      <span className="text-xs text-slate-400">-</span>
                      <input
                        type="time"
                        value={template.endTime}
                        onChange={(e) => updateTemplateField(idx, "endTime", e.target.value)}
                        className="text-xs font-mono bg-transparent border-0 p-0 focus:outline-hidden w-14"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTemplate(idx)}
                      disabled={templates.length <= 1}
                      className="h-8 w-8 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Sélecteur de mode de jours */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 flex-wrap">
                  <span className="text-[11px] font-medium text-slate-500">Appliquer à :</span>
                  <div className="inline-flex gap-1">
                    <button
                      type="button"
                      onClick={() => updateTemplateField(idx, "daysMode", "ALL")}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer",
                        template.daysMode === "ALL" || !template.daysMode
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      )}
                    >
                      Tous les jours
                    </button>
                    <button
                      type="button"
                      onClick={() => updateTemplateField(idx, "daysMode", "WEEK_DAYS")}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer",
                        template.daysMode === "WEEK_DAYS"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      )}
                    >
                      Jours précis de la semaine
                    </button>
                    {eventDates.length > 0 && (
                      <button
                        type="button"
                        onClick={() => updateTemplateField(idx, "daysMode", "SPECIFIC_DATES")}
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer",
                          template.daysMode === "SPECIFIC_DATES"
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        )}
                      >
                        Dates précises
                      </button>
                    )}
                  </div>
                </div>

                {/* Jours de semaine cochables */}
                {template.daysMode === "WEEK_DAYS" && (
                  <div className="flex items-center gap-1 flex-wrap pt-1">
                    {DAYS_OF_WEEK.map((d) => {
                      const isSelected = (template.daysOfWeek || []).includes(d.value);
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleDayOfWeek(idx, d.value)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                            isSelected
                              ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Dates spécifiques cochables */}
                {template.daysMode === "SPECIFIC_DATES" && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => selectAllDates(idx)}
                        className="text-[10px] text-indigo-600 hover:underline font-medium cursor-pointer"
                      >
                        Tout cocher
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => clearAllDates(idx)}
                        className="text-[10px] text-slate-500 hover:underline font-medium cursor-pointer"
                      >
                        Tout décocher
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {eventDates.map((d) => {
                        const isSelected = (template.specificDates || []).includes(d.dateStr);
                        return (
                          <button
                            key={d.dateStr}
                            type="button"
                            onClick={() => toggleSpecificDate(idx, d.dateStr)}
                            className={cn(
                              "px-2 py-0.5 rounded-md text-[11px] font-medium border transition-all cursor-pointer",
                              isSelected
                                ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Barre d'action finale */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push(backUrl)}
          disabled={loading}
          className="text-xs rounded-xl"
        >
          Annuler
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs"
        >
          {loading ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Enregistrement en cours...
            </>
          ) : (
            "Enregistrer l'événement"
          )}
        </Button>
      </div>
    </div>
  );
}
