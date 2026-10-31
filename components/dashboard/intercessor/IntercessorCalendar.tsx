"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getIntercessorPlanning } from "@/app/actions/intercessor";
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
  Clock,
  Filter,
  CheckCircle2,
  Calendar as CalendarIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { PlaningWithIntercessor } from "@/lib/types";
import { cn, convertKeepDate } from "@/lib/utils";
import { SelfAssignModal } from "./events/SelfAsignModel";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { REALTIME_CHANNELS } from "@/lib/realtime-channels";

export function IntercessorCalendar() {
  const { data: session } = useSession();
  const [currentWeekDate, setCurrentWeekDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [events, setEvents] = useState<PlaningWithIntercessor[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [showMyPlanningOnly, setShowMyPlanningOnly] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<PlaningWithIntercessor | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sessionUserId = (session?.user as any)?.id;
  const sessionUserEmail = session?.user?.email?.toLowerCase();

  const isUserMatching = useCallback(
    (u: any) => {
      if (!u) return false;
      if (currentUserId && u.id === currentUserId) return true;
      if (sessionUserId && u.id === sessionUserId) return true;
      if (sessionUserEmail && u.email && u.email.toLowerCase() === sessionUserEmail) return true;
      return false;
    },
    [currentUserId, sessionUserId, sessionUserEmail]
  );

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
      const res = await getIntercessorPlanning(
        startOfWeekDate.toDateString(),
        endOfWeekDate.toDateString()
      );
      if (res.success) {
        setEvents(res.data ?? []);
        setCurrentUserId(res.currentUserId ?? "");
      }
    } finally {
      setIsLoading(false);
    }
  }, [startOfWeekDate, endOfWeekDate]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Synchronisation temps réel automatique
  useRealtimeSync({
    channel: REALTIME_CHANNELS.PRAYER_PLANNING,
    onUpdate: loadEvents,
  });

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

  // Créneaux pour le jour sélectionné
  const daySlots = useMemo(() => {
    const slots = events.filter((evt) => {
      const isDayMatch = isSameDay(convertKeepDate(new Date(evt.date)), selectedDay);
      if (!isDayMatch) return false;
      if (showMyPlanningOnly) {
        return evt.users?.some((u: any) => isUserMatching(u));
      }
      return true;
    });

    return slots.sort((a, b) => {
      const [aH, aM] = (a.startTime || "00:00").split(":").map(Number);
      const [bH, bM] = (b.startTime || "00:00").split(":").map(Number);
      return aH - bH || aM - bM;
    });
  }, [events, selectedDay, showMyPlanningOnly, isUserMatching]);

  const handleOpenSlot = (slot: PlaningWithIntercessor) => {
    setSelectedSlot(slot);
    setIsAssignModalOpen(true);
  };

  const isCurrentWeek = isSameDay(startOfWeekDate, startOfWeek(today, { weekStartsOn: 1 }));

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* 1. Barre de navigation de la semaine */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevWeek}
            className="h-8.5 w-8.5 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
            title="Semaine précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-left px-1.5">
            <span className="text-sm font-bold text-slate-900 capitalize">
              {format(startOfWeekDate, "d MMM", { locale: fr })} — {format(endOfWeekDate, "d MMM yyyy", { locale: fr })}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={nextWeek}
            className="h-8.5 w-8.5 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
            title="Semaine suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {!isCurrentWeek && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl h-8 px-2 cursor-pointer"
            >
              Aujourd&apos;hui
            </Button>
          )}

          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400 ml-1" />}
        </div>

        {/* Filtre sobre */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowMyPlanningOnly(!showMyPlanningOnly)}
            className={cn(
              "h-8.5 text-xs font-medium rounded-xl transition-all cursor-pointer px-3",
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

      {/* 2. Calendrier de Semaine (Bandeau sobre des 7 jours) */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDay);
          const isDayToday = isSameDay(day, today);

          const dayEvents = events.filter((evt) =>
            isSameDay(convertKeepDate(new Date(evt.date)), day)
          );
          const countForDay = dayEvents.length;

          const hasMySlot = dayEvents.some((evt) =>
            evt.users?.some((u: any) => u.id === currentUserId)
          );

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all cursor-pointer relative",
                isSelected
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700"
              )}
            >
              {/* Pastille mon créneau */}
              {hasMySlot && (
                <span
                  className={cn(
                    "absolute top-1 right-1 h-1.5 w-1.5 rounded-full",
                    isSelected ? "bg-emerald-300" : "bg-emerald-500"
                  )}
                  title="Vous êtes inscrit ce jour"
                />
              )}

              <span
                className={cn(
                  "text-[10px] uppercase font-bold tracking-wider",
                  isSelected ? "text-indigo-200" : isDayToday ? "text-indigo-600 font-extrabold" : "text-slate-400"
                )}
              >
                {format(day, "EEE", { locale: fr }).replace(".", "")}
              </span>

              <span className="text-sm sm:text-base font-bold leading-tight mt-0.5">
                {format(day, "d")}
              </span>

              <span
                className={cn(
                  "text-[9px] mt-0.5 font-medium px-1 rounded",
                  isSelected
                    ? "text-indigo-200"
                    : countForDay > 0
                    ? "text-slate-500"
                    : "text-slate-300"
                )}
              >
                {countForDay > 0 ? `${countForDay} cr.` : "-"}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Programmes du Jour Sélectionné */}
      <div className="space-y-3 pt-1">
        {/* Entête épurée du jour */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-900 capitalize flex items-center gap-2">
            <span>{format(selectedDay, "EEEE d MMMM yyyy", { locale: fr })}</span>
            <Badge variant="secondary" className="text-[11px] font-semibold text-slate-600 bg-slate-100">
              {daySlots.length} {daySlots.length > 1 ? "créneaux" : "créneau"}
            </Badge>
          </h2>
        </div>

        {/* Liste des créneaux */}
        {daySlots.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-xs space-y-2">
            <CalendarIcon className="h-6 w-6 text-slate-300 mx-auto" />
            <p className="text-xs font-medium text-slate-500">
              {showMyPlanningOnly
                ? "Aucun créneau assigné pour ce jour."
                : "Aucun créneau prévu pour ce jour."}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {daySlots.map((slot) => {
              const isAssigned = slot.users?.some((u: any) => isUserMatching(u));
              const assignedCount = slot.users?.length || 0;

              return (
                <div
                  key={slot.id}
                  className={cn(
                    "bg-white rounded-xl border p-3.5 sm:p-4 shadow-xs transition-all space-y-2.5",
                    isAssigned
                      ? "border-emerald-200/90 ring-1 ring-emerald-100/80 bg-emerald-50/15"
                      : "border-slate-200/80 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                        <Clock className="h-3 w-3 text-slate-500" />
                        {slot.startTime} — {slot.endTime}
                      </span>

                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {slot.title || "Créneau d'intercession"}
                      </h3>

                      {isAssigned ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 rounded-md px-1.5 py-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Inscrit(e)
                        </span>
                      ) : assignedCount === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/70 rounded-md px-1.5 py-0.5">
                          <AlertCircle className="h-2.5 w-2.5" />
                          À pourvoir
                        </span>
                      ) : null}
                    </div>

                    {/* Action rapide sobre */}
                    <div className="shrink-0">
                      {isAssigned ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenSlot(slot)}
                          className="h-7 px-2.5 text-xs font-semibold rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                        >
                          Se désinscrire
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleOpenSlot(slot)}
                          className="h-7 px-3 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs"
                        >
                          Participer
                        </Button>
                      )}
                    </div>
                  </div>

                  {slot.description && (
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {slot.description}
                    </p>
                  )}

                  {/* Intercesseurs inscrits (nom seul avec avatar, sans étiquette verbeuse) */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {assignedCount > 0 ? (
                      slot.users.map((u: any) => {
                        const isMe = isUserMatching(u);
                        return (
                          <div
                            key={u.id}
                            className={cn(
                              "inline-flex items-center gap-1 pl-1 pr-2 py-0.5 rounded-full text-xs font-medium border",
                              isMe
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-slate-50 text-slate-700 border-slate-200/70"
                            )}
                          >
                            <Avatar className="h-4 w-4 ring-1 ring-white">
                              <AvatarImage src={u.image} />
                              <AvatarFallback className="text-[8px] bg-indigo-100 text-indigo-700 font-bold">
                                {u.name?.slice(0, 1) || "M"}
                              </AvatarFallback>
                            </Avatar>
                            <span>{u.name || "Membre"}{isMe ? " (Moi)" : ""}</span>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Aucun intercesseur positionné
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale d'inscription / désinscription */}
      <SelfAssignModal
        event={selectedSlot}
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          loadEvents();
        }}
        isAssigned={selectedSlot?.users?.some(isUserMatching) ?? false}
      />
    </div>
  );
}
