"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  format,
  isSameDay,
  addDays,
  startOfDay,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Repeat,
  Clock,
  Users,
  Edit,
  Calendar as CalendarIcon,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { EventModal } from "./EventModal";
import { RecurringManager } from "./RecurringManager";
import { getPlanningEvents } from "@/app/actions/planing";
import { PlaningWithIntercessor } from "@/lib/types";
import { cn, convertKeepDate } from "@/lib/utils";

export function PlanningCalendar() {
  const [currentWeekDate, setCurrentWeekDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [events, setEvents] = useState<PlaningWithIntercessor[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  const [modalDate, setModalDate] = useState<Date>(() => new Date());
  const [isLoading, setIsLoading] = useState(false);

  const today = useMemo(() => startOfDay(new Date()), []);

  const startOfWeekDate = useMemo(
    () => startOfWeek(currentWeekDate, { weekStartsOn: 1 }),
    [currentWeekDate]
  );
  const endOfWeekDate = useMemo(
    () => endOfWeek(currentWeekDate, { weekStartsOn: 1 }),
    [currentWeekDate]
  );

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(startOfWeekDate, i));
  }, [startOfWeekDate]);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getPlanningEvents(
        startOfWeekDate.toDateString(),
        endOfWeekDate.toDateString()
      );
      if (res.success) {
        setEvents(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [startOfWeekDate, endOfWeekDate]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const prevWeek = () => {
    const prev = addWeeks(currentWeekDate, -1);
    setCurrentWeekDate(prev);
    const newStart = startOfWeek(prev, { weekStartsOn: 1 });
    setSelectedDay(newStart);
  };

  const nextWeek = () => {
    const next = addWeeks(currentWeekDate, 1);
    setCurrentWeekDate(next);
    const newStart = startOfWeek(next, { weekStartsOn: 1 });
    setSelectedDay(newStart);
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentWeekDate(now);
    setSelectedDay(startOfDay(now));
  };

  // Création d'un créneau pour une date (utilise le jour actuellement sélectionné)
  const handleCreateForDate = () => {
    setSelectedEvent(null);
    setModalDate(selectedDay);
    setIsModalOpen(true);
  };

  // Clic pour modifier un créneau
  const handleEditEvent = (event: any, day: Date) => {
    setSelectedEvent(event);
    setModalDate(day);
    setIsModalOpen(true);
  };

  // Créneaux pour le jour sélectionné
  const daySlots = useMemo(() => {
    const slots = events.filter((evt) =>
      isSameDay(convertKeepDate(new Date(evt.date)), selectedDay)
    );

    return slots.sort((a, b) => {
      const [aH, aM] = (a.startTime || "00:00").split(":").map(Number);
      const [bH, bM] = (b.startTime || "00:00").split(":").map(Number);
      return aH - bH || aM - bM;
    });
  }, [events, selectedDay]);

  const isCurrentWeek = isSameDay(startOfWeekDate, startOfWeek(today, { weekStartsOn: 1 }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Barre de navigation de la semaine et boutons d'actions Leader */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Navigation Semaine */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prevWeek}
            className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 cursor-pointer"
            title="Semaine précédente"
          >
            <ChevronLeft className="h-4 w-4 text-slate-700" />
          </Button>

          <div className="text-left px-2 min-w-[170px] sm:min-w-[210px]">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {format(startOfWeekDate, "MMMM yyyy", { locale: fr })}
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-900 capitalize">
              {format(startOfWeekDate, "d MMM", { locale: fr })} — {format(endOfWeekDate, "d MMM", { locale: fr })}
            </span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={nextWeek}
            className="h-9 w-9 rounded-xl border-slate-200 hover:bg-slate-50 cursor-pointer"
            title="Semaine suivante"
          >
            <ChevronRight className="h-4 w-4 text-slate-700" />
          </Button>

          {!isCurrentWeek && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl ml-1 cursor-pointer"
            >
              Aujourd&apos;hui
            </Button>
          )}
        </div>

        {/* Boutons d'action demandés : récurrence et créneau pour date */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <Button
            variant="outline"
            onClick={() => setIsRecurringOpen(true)}
            className="flex-1 sm:flex-none border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-medium rounded-xl text-xs sm:text-sm h-9 cursor-pointer"
          >
            <Repeat className="mr-1.5 h-4 w-4" />
            Créer des créneaux récurrents
          </Button>

          <Button
            onClick={handleCreateForDate}
            className="flex-1 sm:flex-none bg-indigo-900 hover:bg-indigo-800 text-white font-medium rounded-xl text-xs sm:text-sm h-9 shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Créer un créneau pour une date
          </Button>
        </div>
      </div>

      {/* 2. Calendrier de Semaine (Bandeau des 7 jours) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Choisir un jour de la semaine
          </span>
          {isLoading && (
            <span className="text-xs text-indigo-600 flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> Chargement...
            </span>
          )}
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDay);
            const isDayToday = isSameDay(day, today);

            // Créneaux de ce jour
            const dayEvents = events.filter((evt) =>
              isSameDay(convertKeepDate(new Date(evt.date)), day)
            );
            const countForDay = dayEvents.length;

            // Créneaux non pourvus ce jour
            const unassignedCount = dayEvents.filter(
              (evt) => !evt.users || evt.users.length === 0
            ).length;

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "flex flex-col items-center justify-center py-2.5 sm:py-3 px-1 sm:px-2 rounded-2xl border transition-all cursor-pointer relative shrink-0",
                  isSelected
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 scale-[1.02]"
                    : "bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700 shadow-xs"
                )}
              >
                {/* Pastille créneau à pourvoir */}
                {unassignedCount > 0 && (
                  <span
                    className={cn(
                      "absolute top-1.5 right-1.5 h-2 w-2 rounded-full",
                      isSelected ? "bg-amber-300 ring-2 ring-indigo-600" : "bg-amber-500"
                    )}
                    title={`${unassignedCount} créneau(x) à pourvoir`}
                  />
                )}

                <span
                  className={cn(
                    "text-[10px] uppercase font-bold tracking-wider",
                    isSelected ? "text-indigo-200" : isDayToday ? "text-indigo-600" : "text-slate-400"
                  )}
                >
                  {format(day, "EEE", { locale: fr }).replace(".", "")}
                </span>

                <span className="text-sm sm:text-lg font-bold leading-tight mt-0.5">
                  {format(day, "d")}
                </span>

                <span
                  className={cn(
                    "text-[9px] mt-1 font-medium px-1.5 py-0.2 rounded-full truncate max-w-full",
                    isSelected
                      ? "bg-white/20 text-white"
                      : countForDay > 0
                      ? "bg-slate-100 text-slate-600"
                      : "text-slate-300"
                  )}
                >
                  {countForDay > 0 ? `${countForDay} p.` : "0"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Programmes du Jour Sélectionné (en bas) */}
      <div className="space-y-4">
        {/* Entête du jour sélectionné */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 sm:px-5 py-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
              {format(selectedDay, "d")}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 capitalize leading-snug">
                {format(selectedDay, "EEEE d MMMM yyyy", { locale: fr })}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                {daySlots.length} créneau{daySlots.length > 1 ? "x" : ""} planifié{daySlots.length > 1 ? "s" : ""} ce jour
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Bouton rapide d'ajout pour ce jour spécifique */}
            <Button
              size="sm"
              onClick={handleCreateForDate}
              className="h-8.5 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Nouveau créneau ce jour
            </Button>

            {/* Navigation jour précédent / jour suivant dans la semaine */}
            <div className="flex items-center gap-1 border-l border-slate-100 pl-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl cursor-pointer"
                onClick={() => setSelectedDay(addDays(selectedDay, -1))}
                disabled={isSameDay(selectedDay, weekDays[0])}
                title="Jour précédent"
              >
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl cursor-pointer"
                onClick={() => setSelectedDay(addDays(selectedDay, 1))}
                disabled={isSameDay(selectedDay, weekDays[6])}
                title="Jour suivant"
              >
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </Button>
            </div>
          </div>
        </div>

        {/* Liste des créneaux / programmes pour le jour sélectionné */}
        {daySlots.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-xs space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-300">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-700">
                Aucun programme prévu pour cette date
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Vous n&apos;avez pas encore programmé de créneau d&apos;intercession pour ce jour.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleCreateForDate}
              className="bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Créer un créneau pour ce jour
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {daySlots.map((slot) => {
              const assignedCount = slot.users?.length || 0;
              const isUnassigned = assignedCount === 0;

              return (
                <div
                  key={slot.id}
                  onClick={() => handleEditEvent(slot, selectedDay)}
                  className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 p-4 sm:p-5 shadow-xs transition-all space-y-3.5 cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          <Clock className="h-3.5 w-3.5 text-indigo-500" />
                          {slot.startTime} — {slot.endTime}
                        </span>

                        {isUnassigned ? (
                          <Badge
                            variant="secondary"
                            className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold gap-1 px-2 py-0.5"
                          >
                            <AlertCircle className="h-3 w-3 text-amber-600" />
                            À pourvoir
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold gap-1 px-2 py-0.5"
                          >
                            <Users className="h-3 w-3" />
                            {assignedCount} {assignedCount > 1 ? "intercesseurs" : "intercesseur"}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors leading-snug">
                        {slot.title || "Créneau d'intercession"}
                      </h3>

                      {slot.description && (
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {slot.description}
                        </p>
                      )}
                    </div>

                    {/* Bouton Modifier */}
                    <div className="shrink-0 self-start sm:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEvent(slot, selectedDay);
                        }}
                        className="h-8.5 text-xs font-semibold rounded-xl text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                        Modifier
                      </Button>
                    </div>
                  </div>

                  {/* Intercesseurs inscrits */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Assignés ({assignedCount}) :
                      </span>

                      {assignedCount > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {slot.users.map((u: any) => (
                            <div
                              key={u.id}
                              className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-50 text-slate-700 border-slate-200/70"
                            >
                              <Avatar className="h-4.5 w-4.5 ring-1 ring-white">
                                <AvatarImage src={u.image} />
                                <AvatarFallback className="text-[9px] bg-indigo-100 text-indigo-700 font-bold">
                                  {u.name?.slice(0, 1) || "M"}
                                </AvatarFallback>
                              </Avatar>
                              <span>{u.name || "Membre"}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/60 rounded-md px-2 py-0.5 font-medium">
                          Aucun intercesseur positionné
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale d'édition / création de créneau */}
      <EventModal
        date={modalDate}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
        onRefresh={loadEvents}
      />

      {/* Modale de gestion des programmes récurrents */}
      <RecurringManager
        isOpen={isRecurringOpen}
        onClose={() => setIsRecurringOpen(false)}
        onRefresh={loadEvents}
      />
    </div>
  );
}
