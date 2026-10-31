"use client";

import { useState, useMemo } from "react";
import { format, isSameDay, isWithinInterval, startOfDay, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  Users, 
  ChevronRight, 
  ChevronLeft, 
  Filter,
  Check,
  UserCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import { SelfAssignModal } from "./SelfAsignModel";
import { SpecialEventWithPlaning } from "@/lib/types";
import { convertKeepDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { REALTIME_CHANNELS } from "@/lib/realtime-channels";

interface IntercessorEventCalendarProps {
  event: SpecialEventWithPlaning;
  currentUserId: string;
}

export function IntercessorEventCalendar({ event, currentUserId }: IntercessorEventCalendarProps) {
  const router = useRouter();

  const eventStartDate = convertKeepDate(event.startDate);
  const eventEndDate = convertKeepDate(event.endDate);
  const today = new Date();

  // Liste ordonnée de tous les jours de l'événement
  const eventDays = useMemo(() => {
    const days: Date[] = [];
    let current = startOfDay(eventStartDate);
    const end = startOfDay(eventEndDate);

    while (current <= end) {
      days.push(new Date(current));
      current = addDays(current, 1);
    }
    return days;
  }, [eventStartDate, eventEndDate]);

  // Jour sélectionné par défaut : aujourd'hui si dans l'intervalle, sinon premier jour
  const defaultDay = useMemo(() => {
    const isTodayInEvent = isWithinInterval(startOfDay(today), {
      start: startOfDay(eventStartDate),
      end: startOfDay(eventEndDate),
    });
    return isTodayInEvent ? startOfDay(today) : (eventDays[0] || startOfDay(eventStartDate));
  }, [today, eventStartDate, eventEndDate, eventDays]);

  const [selectedDay, setSelectedDay] = useState<Date>(defaultDay);

  // Synchronisation temps réel automatique
  useRealtimeSync({
    channel: REALTIME_CHANNELS.SPECIAL_EVENTS,
    onUpdate: () => {
      router.refresh();
    },
  });
  const [showMyPlanningOnly, setShowMyPlanningOnly] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Statistiques de l'événement
  const mySlotsCount = useMemo(() => {
    return (event.plannings || []).filter((p) =>
      p.users?.some((u: any) => u.id === currentUserId)
    ).length;
  }, [event.plannings, currentUserId]);

  const totalSlotsCount = event.plannings?.length || 0;

  // Créneaux pour le jour sélectionné
  const daySlots = useMemo(() => {
    const slots = (event.plannings || []).filter((slot) => {
      const isDayMatch = isSameDay(convertKeepDate(slot.date), selectedDay);
      if (!isDayMatch) return false;
      if (showMyPlanningOnly) {
        return slot.users?.some((u: any) => u.id === currentUserId);
      }
      return true;
    });

    return slots.sort((a, b) => {
      const [aH, aM] = a.startTime.split(":").map(Number);
      const [bH, bM] = b.startTime.split(":").map(Number);
      return aH - bH || aM - bM;
    });
  }, [event.plannings, selectedDay, showMyPlanningOnly, currentUserId]);

  const handleOpenSlot = (slot: any) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    router.refresh();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Carte de Présentation sobre */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
                <CalendarIcon className="h-3 w-3 text-slate-500" />
                Du {format(eventStartDate, "d MMMM", { locale: fr })} au {format(eventEndDate, "d MMMM yyyy", { locale: fr })}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
              {event.title}
            </h1>

            {event.description && (
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                {event.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-medium block">
                Votre engagement
              </span>
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 justify-end">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {mySlotsCount} créneau{mySlotsCount > 1 ? "x" : ""}
              </span>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowMyPlanningOnly(!showMyPlanningOnly)}
              className={cn(
                "h-8 text-xs font-semibold rounded-xl transition-all cursor-pointer",
                showMyPlanningOnly
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                  : "text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              {showMyPlanningOnly ? "Tous les créneaux" : "Mes créneaux"}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Carrousel horizontal de sélection des jours (Mobile & Desktop) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Choisir une date
          </span>
          <span className="text-xs text-indigo-600 font-medium">
            {eventDays.length} jours au total
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 px-0.5 no-scrollbar scroll-smooth">
          {eventDays.map((day) => {
            const isSelected = isSameDay(day, selectedDay);
            const isToday = isSameDay(day, today);
            
            // Compter les créneaux de ce jour
            const countForDay = (event.plannings || []).filter((p) =>
              isSameDay(convertKeepDate(p.date), day)
            ).length;

            const hasMySlot = (event.plannings || []).some(
              (p) => isSameDay(convertKeepDate(p.date), day) && p.users?.some((u: any) => u.id === currentUserId)
            );

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[70px] sm:min-w-[80px] py-2.5 px-2 rounded-2xl border transition-all cursor-pointer relative shrink-0",
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 scale-102"
                    : "bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700 shadow-xs"
                )}
              >
                {/* Pastille mon créneau */}
                {hasMySlot && (
                  <span
                    className={cn(
                      "absolute top-1.5 right-1.5 h-2 w-2 rounded-full",
                      isSelected ? "bg-emerald-300 ring-2 ring-indigo-600" : "bg-emerald-500"
                    )}
                    title="Vous avez un créneau ce jour"
                  />
                )}

                <span
                  className={cn(
                    "text-[10px] uppercase font-bold tracking-wider",
                    isSelected ? "text-indigo-200" : "text-slate-400"
                  )}
                >
                  {format(day, "EEE", { locale: fr })}
                </span>

                <span className="text-base sm:text-lg font-bold leading-tight mt-0.5">
                  {format(day, "d")}
                </span>

                <span
                  className={cn(
                    "text-[9px] mt-0.5 font-medium px-1.5 py-0.2 rounded-full",
                    isSelected
                      ? "bg-white/20 text-white"
                      : countForDay > 0
                      ? "bg-slate-100 text-slate-600"
                      : "text-slate-300"
                  )}
                >
                  {countForDay} {countForDay > 1 ? "créneaux" : "créneau"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Entête du Jour Sélectionné */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
            {format(selectedDay, "d")}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 capitalize leading-snug">
              {format(selectedDay, "EEEE d MMMM yyyy", { locale: fr })}
            </h2>
            <p className="text-[11px] text-slate-500">
              {daySlots.length} créneau{daySlots.length > 1 ? "x" : ""}{" "}
              {showMyPlanningOnly ? "réservé(s) par vous" : "disponible(s)"}
            </p>
          </div>
        </div>

        {/* Navigation Jour Précédent / Suivant */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl cursor-pointer"
            onClick={() => setSelectedDay(addDays(selectedDay, -1))}
            disabled={isSameDay(selectedDay, eventDays[0] || eventStartDate)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl cursor-pointer"
            onClick={() => setSelectedDay(addDays(selectedDay, 1))}
            disabled={isSameDay(selectedDay, eventDays[eventDays.length - 1] || eventEndDate)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 4. Liste Présentation des Créneaux du Jour */}
      {daySlots.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Clock className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            {showMyPlanningOnly
              ? "Vous n'avez aucun créneau réservé pour cette journée."
              : "Aucun créneau planifié pour cette journée."}
          </p>
          {showMyPlanningOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMyPlanningOnly(false)}
              className="text-xs rounded-xl"
            >
              Afficher tous les créneaux
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {daySlots.map((slot: any) => {
            const isAssigned = slot.users?.some((u: any) => u.id === currentUserId);
            const slotUsers = slot.users || [];

            return (
              <div
                key={slot.id}
                onClick={() => handleOpenSlot(slot)}
                className={cn(
                  "group relative flex flex-col justify-between p-4 rounded-2xl border transition-all cursor-pointer shadow-xs hover:shadow-sm",
                  isAssigned
                    ? "bg-emerald-50/30 border-emerald-300 ring-1 ring-emerald-200"
                    : "bg-white hover:bg-slate-50 border-slate-200/80"
                )}
              >
                {/* Ligne du haut : Horaires & Statut */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>

                  {isAssigned ? (
                    <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-800 border-emerald-200 gap-1 text-[11px] font-semibold rounded-lg shadow-none">
                      <Check className="h-3 w-3 stroke-[2.5]" />
                      Votre créneau
                    </Badge>
                  ) : slotUsers.length > 0 ? (
                    <Badge variant="outline" className="text-slate-600 border-slate-200 text-[11px] rounded-lg">
                      {slotUsers.length} inscrit{slotUsers.length > 1 ? "s" : ""}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50/50 text-[11px] font-medium rounded-lg">
                      Disponible
                    </Badge>
                  )}
                </div>

                {/* Titre et détails du créneau */}
                <div className="my-3">
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-950 transition-colors">
                    {slot.title}
                  </h3>
                  {slot.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {slot.description}
                    </p>
                  )}
                </div>

                {/* Ligne du bas : Intercesseurs inscrits + Bouton d'action direct */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  {/* Visages des participants */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    {slotUsers.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-2 overflow-hidden">
                          {slotUsers.slice(0, 3).map((u: any) => (
                            <Avatar key={u.id} className="h-6 w-6 border-2 border-white shadow-xs">
                              <AvatarImage src={u.image} />
                              <AvatarFallback className="text-[9px] bg-indigo-100 text-indigo-700 font-bold">
                                {u.name?.slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span className="text-[11px] text-slate-500 truncate max-w-[120px] sm:max-w-[150px]">
                          {slotUsers.map((u: any) => u.name?.split(" ")[0]).join(", ")}
                          {slotUsers.length > 3 && ` +${slotUsers.length - 3}`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Aucun inscrit pour le moment
                      </span>
                    )}
                  </div>

                  {/* Bouton d'action */}
                  <span
                    className={cn(
                      "text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0",
                      isAssigned
                        ? "text-rose-600 bg-rose-50 hover:bg-rose-100"
                        : "text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white"
                    )}
                  >
                    {isAssigned ? "Modifier" : "Rejoindre"}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale d'inscription / désinscription fluide */}
      <SelfAssignModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        event={selectedSlot}
        isAssigned={selectedSlot?.users?.some((u: any) => u.id === currentUserId) || false}
      />
    </div>
  );
}
