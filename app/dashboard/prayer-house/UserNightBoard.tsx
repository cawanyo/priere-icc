"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, addWeeks, addDays, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronLeft,
  ChevronRight,
  Moon,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  MessageSquareQuote,
  Loader2,
  Clock,
} from "lucide-react";
import { getUserPrayerHouseData, toggleSelfAssignment } from "@/app/actions/prayer-house-user";
import { toast } from "sonner";
import { convertKeepDate, cn } from "@/lib/utils";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { REALTIME_CHANNELS } from "@/lib/realtime-channels";

export function UserNightBoard() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [togglingSlot, setTogglingSlot] = useState<string | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 5 }).map((_, i) => addDays(weekStart, i));
  const hours = ["00:00", "01:00", "02:00", "03:00"];

  // Jour sélectionné : par défaut aujourd'hui si dans la semaine de garde, sinon le premier jour (Lundi)
  const [selectedDay, setSelectedDay] = useState<Date>(() => {
    const now = new Date();
    const ws = startOfWeek(new Date(), { weekStartsOn: 1 });
    const initialDays = Array.from({ length: 5 }).map((_, i) => addDays(ws, i));
    return initialDays.find((d) => isSameDay(d, now)) || initialDays[0];
  });

  // Re-synchroniser le jour sélectionné si l'utilisateur change de semaine
  useEffect(() => {
    const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
    const currentDays = Array.from({ length: 5 }).map((_, i) => addDays(ws, i));
    const now = new Date();
    const match = currentDays.find((d) => isSameDay(d, now));
    setSelectedDay(match || currentDays[0]);
  }, [currentDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getUserPrayerHouseData(currentDate.toDateString());
      if (res.success) setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentDate]);

  // Synchronisation temps réel automatique (Pusher + Supabase)
  useRealtimeSync({
    channel: REALTIME_CHANNELS.PRAYER_HOUSE,
    onUpdate: loadData,
  });

  if (loading) {
    return (
      <div className="h-52 flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Cas 1 : Pas de famille assignée
  if (!data?.hasFamily) {
    return (
      <div className="p-8 rounded-2xl text-center bg-white border border-slate-200/80 shadow-xs max-w-lg mx-auto space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Aucune maison de prière assignée</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Vous n&apos;êtes rattaché(e) à aucune Maison de Prière pour le moment. Rapprochez-vous d&apos;un responsable pour être intégré(e).
        </p>
      </div>
    );
  }

  const { family, assignment, isFamilyOnDuty, userId } = data;

  const getDayTheme = (date: Date) => {
    if (!data?.assignment?.dayThemes) return null;
    return data.assignment.dayThemes.find((t: any) =>
      isSameDay(convertKeepDate(t.date), date)
    )?.theme;
  };

  const handleToggle = async (day: Date, hour: string, isMe: boolean) => {
    if (!isFamilyOnDuty) return;
    const slotKey = `${day.toISOString()}-${hour}`;
    setTogglingSlot(slotKey);
    try {
      const res = await toggleSelfAssignment({
        assignmentId: assignment.id,
        date: day,
        startTime: hour,
        action: isMe ? "LEAVE" : "JOIN",
      });
      if (res.success) {
        toast.success(isMe ? "Retrait du créneau confirmé" : "Créneau réservé avec succès");
        loadData();
      } else {
        toast.error(res.error || "Erreur lors de l'action");
      }
    } catch {
      toast.error("Erreur lors de l'assignation");
    } finally {
      setTogglingSlot(null);
    }
  };

  const selectedDayTheme = getDayTheme(selectedDay);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* 1. En-tête compact : Famille & Navigation semaine */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
            style={{ backgroundColor: family.color || "#4f46e5" }}
          >
            {family.name[0]}
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900">{family.name}</h3>
            <p className="text-[11px] text-slate-400">Sentinelles nocturnes (00h — 04h)</p>
          </div>
        </div>

        {/* Contrôle de la semaine */}
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate(addWeeks(currentDate, -1))}
            className="h-8 w-8 rounded-lg cursor-pointer"
            title="Semaine précédente"
          >
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          </Button>
          <div className="text-center px-2 min-w-[130px]">
            <span className="block text-xs font-bold text-slate-900 capitalize leading-none">
              {format(currentDate, "MMMM yyyy", { locale: fr })}
            </span>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              {format(weekStart, "d MMM", { locale: fr })} — {format(addDays(weekStart, 4), "d MMM", { locale: fr })}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
            className="h-8 w-8 rounded-lg cursor-pointer"
            title="Semaine suivante"
          >
            <ChevronRight className="h-4 w-4 text-slate-600" />
          </Button>
        </div>
      </div>

      {/* 2. Sujet de la semaine sobre et respectant les sauts de ligne */}
      {data?.assignment?.weekTheme && (
        <div className="bg-indigo-50/70 border border-indigo-100 p-3 sm:p-4 rounded-2xl flex gap-3 items-start shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
            <MessageSquareQuote className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
              Thème de la semaine
            </span>
            <p className="text-xs sm:text-sm text-indigo-950 font-semibold leading-relaxed break-words whitespace-pre-wrap mt-0.5">
              {data.assignment.weekTheme}
            </p>
          </div>
        </div>
      )}

      {/* 3. Bannière d'état de la garde */}
      {!assignment ? (
        <div className="text-center py-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <Moon className="h-6 w-6 text-slate-300 mx-auto" />
          <p className="text-xs font-medium text-slate-500">Le planning pour cette semaine n&apos;est pas encore ouvert.</p>
        </div>
      ) : !isFamilyOnDuty ? (
        <div className="p-3.5 bg-amber-50/60 border border-amber-200/70 rounded-2xl flex items-center gap-3">
          <Moon className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="text-xs text-amber-900 leading-snug">
            <span className="font-bold">Repos cette semaine</span> — C&apos;est la maison <strong>« {assignment.prayerFamily.name} »</strong> qui assure la garde.
          </div>
        </div>
      ) : (
        <>
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />
            <p className="text-xs text-indigo-900 font-medium">
              Votre maison est de garde cette semaine. Cliquez sur une date ci-dessous pour voir le thème et réserver votre créneau.
            </p>
          </div>

          {/* 4. Ligne d'options avec les 5 nuits de la semaine */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Choisir une nuit
              </span>
              <span className="text-xs text-indigo-600 font-semibold">
                5 nuits (00h — 04h)
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
              {days.map((day) => {
                const isSelected = isSameDay(day, selectedDay);
                const hasMySlot = assignment.schedules?.some(
                  (s: any) => isSameDay(convertKeepDate(s.date), day) && s.userId === userId
                );
                const filledCount = assignment.schedules?.filter(
                  (s: any) => isSameDay(convertKeepDate(s.date), day) && s.userId
                ).length || 0;

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "relative flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-2xl border transition-all cursor-pointer text-center",
                      isSelected
                        ? "bg-indigo-900 text-white border-indigo-900 shadow-md shadow-indigo-900/20 scale-[1.02]"
                        : "bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700 shadow-2xs"
                    )}
                  >
                    {hasMySlot && (
                      <span
                        className={cn(
                          "absolute top-1.5 right-1.5 h-2 w-2 rounded-full",
                          isSelected ? "bg-emerald-300 ring-2 ring-indigo-900" : "bg-emerald-500"
                        )}
                        title="Vous êtes positionné(e) cette nuit"
                      />
                    )}

                    <span
                      className={cn(
                        "text-[10px] sm:text-[11px] uppercase font-bold tracking-wider",
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
                          : filledCount === 4
                          ? "bg-emerald-50 text-emerald-700 font-semibold"
                          : filledCount > 0
                          ? "bg-slate-100 text-slate-600"
                          : "text-slate-400"
                      )}
                    >
                      {filledCount}/4
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Affichage du planning et du thème de la nuit sélectionnée */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
            {/* Entête du jour sélectionné */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                  {format(selectedDay, "d")}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 capitalize leading-snug">
                    {format(selectedDay, "EEEE d MMMM yyyy", { locale: fr })}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Garde nocturne de 00h00 à 04h00
                  </p>
                </div>
              </div>

              {/* Navigation Jour Précédent / Suivant */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg cursor-pointer"
                  onClick={() => {
                    const idx = days.findIndex((d) => isSameDay(d, selectedDay));
                    if (idx > 0) setSelectedDay(days[idx - 1]);
                  }}
                  disabled={isSameDay(selectedDay, days[0])}
                  title="Nuit précédente"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg cursor-pointer"
                  onClick={() => {
                    const idx = days.findIndex((d) => isSameDay(d, selectedDay));
                    if (idx < days.length - 1) setSelectedDay(days[idx + 1]);
                  }}
                  disabled={isSameDay(selectedDay, days[days.length - 1])}
                  title="Nuit suivante"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Thème du jour sélectionné avec respect strict des sauts de ligne */}
            {selectedDayTheme ? (
              <div className="bg-indigo-50/70 border border-indigo-100/80 rounded-2xl p-3.5 sm:p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  <MessageSquareQuote className="h-4 w-4" />
                  <span>Thème de prière de la nuit</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-indigo-950 leading-relaxed break-words whitespace-pre-wrap">
                  {selectedDayTheme}
                </p>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 italic bg-slate-50/60 rounded-xl px-3 py-2.5 border border-dashed border-slate-200">
                Aucun thème particulier défini pour cette nuit.
              </div>
            )}

            {/* Créneaux d'intercession de la nuit */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Créneaux d&apos;intercession
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {hours.map((hour) => {
                  const schedule = assignment.schedules?.find(
                    (s: any) =>
                      isSameDay(convertKeepDate(s.date), selectedDay) &&
                      s.startTime === hour
                  );

                  const isTaken = !!schedule && !!schedule.user;
                  const isMe = schedule?.userId === userId;
                  const slotKey = `${selectedDay.toISOString()}-${hour}`;
                  const isToggling = togglingSlot === slotKey;
                  const nextHour = `${parseInt(hour) + 1}`.padStart(2, "0") + ":00";

                  return (
                    <div
                      key={hour}
                      className={cn(
                        "p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-2xs",
                        isMe
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-950 ring-1 ring-emerald-300/60"
                          : isTaken
                          ? "bg-slate-50 border-slate-200/80 text-slate-800"
                          : "bg-white hover:bg-indigo-50/40 border-slate-200/80 hover:border-indigo-200"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 font-mono text-xs font-bold",
                            isMe
                              ? "bg-emerald-100 text-emerald-800"
                              : isTaken
                              ? "bg-slate-200/70 text-slate-700"
                              : "bg-indigo-50 text-indigo-700"
                          )}
                        >
                          <Clock className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-bold text-slate-900 block leading-tight">
                            {hour} — {nextHour}
                          </span>
                          {isMe ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-0.5">
                              <CheckCircle2 className="h-3 w-3" /> Vous êtes programmé(e)
                            </span>
                          ) : isTaken ? (
                            <div className="flex items-center gap-1.5 mt-0.5 truncate">
                              <Avatar className="h-4 w-4 shrink-0 ring-1 ring-white">
                                <AvatarImage src={schedule.user?.image} />
                                <AvatarFallback className="text-[7px] bg-indigo-100 text-indigo-700 font-bold">
                                  {schedule.user?.name?.[0] || "M"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-[11px] font-medium text-slate-700 truncate">
                                {schedule.user?.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Créneau disponible
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isToggling ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        ) : isMe ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggle(selectedDay, hour, true)}
                            className="h-7 px-2.5 text-xs font-semibold rounded-lg border-emerald-300 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 cursor-pointer"
                          >
                            Se retirer
                          </Button>
                        ) : isTaken ? (
                          <span className="text-[10px] font-semibold text-slate-400 px-2 py-1 rounded-md bg-slate-100">
                            Occupé
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleToggle(selectedDay, hour, false)}
                            className="h-7 px-2.5 text-xs font-semibold rounded-lg bg-indigo-900 hover:bg-indigo-800 text-white cursor-pointer shadow-xs"
                          >
                            + Prendre
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
