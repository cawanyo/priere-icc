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

  // Synchronisation temps réel automatique
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
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 5 }).map((_, i) => addDays(weekStart, i));
  const hours = ["00:00", "01:00", "02:00", "03:00"];

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

  return (
    <div className="space-y-4">
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

      {/* 2. Sujet de la semaine sobre et compact */}
      {data?.assignment?.weekTheme && (
        <div className="bg-indigo-50/70 border border-indigo-100 p-3 sm:p-3.5 rounded-2xl flex gap-3 items-start shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
            <MessageSquareQuote className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
              Thème de la semaine
            </span>
            <p className="text-xs sm:text-sm text-indigo-950 font-semibold leading-relaxed break-words whitespace-pre-wrap mt-0.5">
              « {data.assignment.weekTheme} »
            </p>
          </div>
        </div>
      )}

      {/* 3. Bannière d'état de la garde sobre */}
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
              Votre maison est de garde cette semaine. Cliquez sur un créneau libre pour vous positionner.
            </p>
          </div>

          {/* 4. Grille compacte des 5 nuits (Lundi à Vendredi) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {days.map((day) => {
              const dayTheme = getDayTheme(day);

              return (
                <div
                  key={day.toISOString()}
                  className="bg-white rounded-2xl border border-slate-200/80 p-2.5 shadow-xs space-y-2"
                >
                  {/* Entête du jour compact */}
                  <div className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
                    <span className="block text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                      {format(day, "EEEE", { locale: fr })}
                    </span>
                    <span className="block text-base font-bold text-slate-900 leading-tight">
                      {format(day, "d MMM", { locale: fr })}
                    </span>
                    {dayTheme && (
                      <p className="text-[10px] text-indigo-700 italic break-words whitespace-normal leading-tight mt-1 pt-1 border-t border-slate-200/50">
                        « {dayTheme} »
                      </p>
                    )}
                  </div>

                  {/* Créneaux horaires compacts */}
                  <div className="space-y-1">
                    {hours.map((hour) => {
                      const schedule = assignment.schedules?.find(
                        (s: any) =>
                          isSameDay(convertKeepDate(s.date), day) &&
                          s.startTime === hour
                      );

                      const isTaken = !!schedule;
                      const isMe = schedule?.userId === userId;
                      const slotKey = `${day.toISOString()}-${hour}`;
                      const isToggling = togglingSlot === slotKey;

                      return (
                        <button
                          key={hour}
                          type="button"
                          disabled={isToggling || (!isMe && isTaken)}
                          onClick={() => handleToggle(day, hour, isMe)}
                          className={cn(
                            "w-full px-2 py-1 rounded-lg border text-left transition-all flex items-center justify-between gap-1 cursor-pointer text-xs min-h-[30px]",
                            isMe
                              ? "bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold ring-1 ring-emerald-300/60"
                              : isTaken
                              ? "bg-slate-50 border-slate-200/80 text-slate-700 cursor-default"
                              : "bg-white hover:bg-indigo-50/70 border-slate-200/80 hover:border-indigo-200 text-slate-600"
                          )}
                        >
                          <span className="font-semibold text-[10px] text-slate-500 shrink-0">
                            {hour}
                          </span>

                          <div className="flex-1 min-w-0 text-right">
                            {isToggling ? (
                              <Loader2 className="h-3 w-3 animate-spin text-slate-400 ml-auto" />
                            ) : isMe ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                                <CheckCircle2 className="h-3 w-3" /> Moi
                              </span>
                            ) : isTaken ? (
                              <div className="flex items-center justify-end gap-1 truncate">
                                <Avatar className="h-3.5 w-3.5 shrink-0 ring-1 ring-white">
                                  <AvatarImage src={schedule.user?.image} />
                                  <AvatarFallback className="text-[7px] bg-indigo-100 text-indigo-700 font-bold">
                                    {schedule.user?.name?.[0] || "M"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-[10px] truncate font-medium text-slate-700">
                                  {schedule.user?.name?.split(" ")[0]}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-indigo-600 font-semibold">
                                + Libre
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
