"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, addWeeks, addDays, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Moon, ShieldCheck, ShieldAlert, CheckCircle2, AlertCircle, MessageSquareQuote } from "lucide-react";
import { getUserPrayerHouseData, toggleSelfAssignment } from "@/app/actions/prayer-house-user";
import { normalizeDate } from "@/lib/utils";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function UserNightBoard() {
  const [currentDate, setCurrentDate] = useState(normalizeDate(new Date()));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const res = await getUserPrayerHouseData(currentDate);
    if (res.success) setData(res);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const handleSlotClick = async (date: Date, hour: string, isMe: boolean, isTaken: boolean) => {
    if (!data?.assignment) return;
    
    // Si c'est pris par quelqu'un d'autre, on ne fait rien
    if (isTaken && !isMe) {
        toast.info("Ce créneau est déjà assuré par une autre sentinelle.");
        return;
    }

    setActionLoading(true);
    const res = await toggleSelfAssignment({
        assignmentId: data.assignment.id,
        date: date,
        startTime: hour,
        action: isMe ? "LEAVE" : "JOIN"
    });
    setActionLoading(false);

    if (res.success) {
        toast.success(isMe ? "Vous vous êtes retiré du créneau" : "Vous avez pris le créneau !");
        loadData();
    } else {
        toast.error(res.error || "Erreur");
    }
  };

  // --- RENDU ---

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600"/></div>;

  // CAS 1 : Pas de famille
  if (!data?.hasFamily) {
    return (
        <div className="p-8 border-2 border-dashed rounded-xl text-center bg-gray-50">
            <ShieldAlert className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-bold text-gray-800">Aucune famille assignée</h3>
            <p className="text-gray-500 mt-2">
                Vous n'appartenez à aucune Maison de Prière pour le moment.<br/>
                Contactez un leader pour rejoindre une famille.
            </p>
        </div>
    );
  }

  const getDayTheme = (date: Date) => {
    if (!data?.assignment?.dayThemes) return null;
    return data.assignment.dayThemes.find((t: any) => 
        isSameDay(new Date(t.date), date)
    )?.theme;
};

  const { family, assignment, isFamilyOnDuty, userId } = data;
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 5 }).map((_, i) => addDays(weekStart, i));
  const hours = ["00:00", "01:00", "02:00", "03:00"];

  return (
    <div className="space-y-6">
        
        {/* En-tête : Info Famille + Navigation Date */}
        <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm" style={{ backgroundColor: family.color }}>
                    {family.name[0]}
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">{family.name}</h3>
                    <p className="text-xs text-gray-500">Votre Maison de Prière</p>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg">
                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, -1))} className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center min-w-[140px]">
                    <span className="block text-sm font-bold text-indigo-900 capitalize">
                        {format(currentDate, "MMMM yyyy", { locale: fr })}
                    </span>
                    <span className="block text-[10px] text-gray-500">
                        Semaine du {format(weekStart, "d")}
                    </span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>

        {data?.assignment?.weekTheme && (
            <div className="bg-gradient-to-r from-indigo-50 to-white border border-indigo-100 p-4 rounded-xl flex gap-3 items-start shadow-sm">
                <MessageSquareQuote className="h-6 w-6 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                    <span className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
                        Sujet de la semaine
                    </span>
                    <p className="text-lg text-indigo-900 font-serif font-medium leading-tight">
                        "{data.assignment.weekTheme}"
                    </p>
                </div>
            </div>
        )}

        {/* État de la Garde */}
        {!assignment ? (
            <div className="text-center py-10 bg-gray-50/50 rounded-xl border border-dashed">
                <p className="text-gray-500">Le planning pour cette semaine n'est pas encore ouvert.</p>
            </div>
        ) : !isFamilyOnDuty ? (
            <div className="p-6 bg-yellow-50 border border-yellow-100 rounded-xl flex items-start gap-4">
                <Moon className="h-6 w-6 text-yellow-600 mt-1" />
                <div>
                    <h4 className="font-bold text-yellow-800">Repos cette semaine</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                        C'est la famille <strong>"{assignment.family.name}"</strong> qui est de garde cette semaine.
                        <br/>Profitez-en pour vous reposer ou intercéder librement !
                    </p>
                </div>
            </div>
        ) : (
            <>
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3 mb-4">
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                    <p className="text-sm text-indigo-800 font-medium">
                        Votre famille est de garde ! Cliquez sur un créneau libre pour le prendre.
                    </p>
                </div>

                {/* GRILLE RESPONSIVE */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {days.map(day => {
                        const dayTheme = getDayTheme(day);
                        return (
                        <Card key={day.toISOString()} className="overflow-hidden border-indigo-50 shadow-sm">
                            <div className="bg-gray-50 p-2 text-center border-b">
                                <span className="block text-xs uppercase text-gray-500 font-bold">{format(day, "EEEE", { locale: fr })}</span>
                                <span className="block text-lg font-bold text-gray-800">{format(day, "d")}</span>
                                {dayTheme && (
                                <div className="mt-1 pt-1 border-t border-gray-200/50">
                                    <p className="text-[10px] text-indigo-600 font-medium italic leading-tight px-1 line-clamp-2">
                                        "{dayTheme}"
                                    </p>
                                </div>
                            )}
                            </div>
                            <div className="p-2 space-y-2">
                                {hours.map(hour => {
                                    const schedule = assignment.schedules.find((s: any) => 
                                        isSameDay(new Date(s.date), day) && s.startTime === hour
                                    );
                                    
                                    const isTaken = !!schedule;
                                    const isMe = schedule?.userId === userId;

                                    return (
                                        <button
                                            key={hour}
                                            onClick={() => handleSlotClick(day, hour, isMe, isTaken)}
                                            disabled={actionLoading}
                                            className={`
                                                w-full p-2 rounded-lg border text-left transition-all relative
                                                ${isMe 
                                                    ? "bg-green-50 border-green-200 ring-1 ring-green-300 shadow-sm" 
                                                    : isTaken 
                                                        ? "bg-gray-50 border-gray-100 opacity-80 cursor-default" 
                                                        : "bg-white border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50"
                                                }
                                            `}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`text-xs font-bold ${isMe ? "text-green-700" : "text-gray-500"}`}>
                                                    {hour}
                                                </span>
                                                {isMe && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                                            </div>

                                            {isTaken ? (
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarImage src={schedule.user.image} />
                                                        <AvatarFallback className="text-[9px]">{schedule.user.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <span className={`text-[10px] truncate font-medium ${isMe ? "text-green-800" : "text-gray-600"}`}>
                                                        {isMe ? "Moi" : schedule.user.name.split(" ")[0]}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="text-center py-1">
                                                    <span className="text-[10px] text-gray-400 font-medium uppercase">Libre</span>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </Card>
                    )})}
                </div>
            </>
        )}
    </div>
  );
}