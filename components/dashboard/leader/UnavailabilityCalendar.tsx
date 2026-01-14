"use client";

import { useState, useEffect } from "react";
import { 
    format, startOfMonth, endOfMonth, eachDayOfInterval, 
    addMonths, subMonths, getDay, isWithinInterval, startOfDay, endOfDay 
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getFamilyUnavailabilities } from "@/app/actions/prayer-house-planning";

interface Props {
    familyId: string;
}

export function UnavailabilityCalendar({ familyId }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [unavailabilities, setUnavailabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await getFamilyUnavailabilities(familyId, currentDate);
      if (res.success) {
        setUnavailabilities(res.data || []);
      }
      setLoading(false);
    };
    load();
  }, [familyId, currentDate]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const startDayIndex = (getDay(startOfMonth(currentDate)) + 6) % 7; 

  // Fonction Helper pour vérifier si une indispo couvre ce jour
  const isAbsent = (day: Date, unavailability: any) => {
    // On normalise les dates pour éviter les soucis d'heures (00:00 vs 14:00)
    const checkDate = startOfDay(day);
    const start = startOfDay(new Date(unavailability.startDate));
    const end = endOfDay(new Date(unavailability.endDate));

    return isWithinInterval(checkDate, { start, end });
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* ... HEADER (identique à avant) ... */}

      <div className="p-4">
        {loading ? (
           <div className="h-64 flex items-center justify-center text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin" />
           </div>
        ) : (
            <div className="grid grid-cols-7 border-l border-t bg-gray-200 gap-px">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                <div key={d} className="bg-gray-50 p-2 text-center text-xs font-semibold text-gray-500 uppercase">
                {d}
                </div>
            ))}

            {Array.from({ length: startDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-white h-32" />
            ))}

            {days.map((day) => {
                // --- CORRECTION ICI ---
                // On filtre les indisponibilités qui "couvrent" ce jour
                const absents = unavailabilities.filter((u) => isAbsent(day, u));
                
                // Pour savoir si c'est aujourd'hui (juste pour le style)
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                return (
                <div key={day.toISOString()} className={`bg-white h-32 p-2 flex flex-col hover:bg-gray-50 transition-colors relative ${isToday ? "bg-indigo-50/30" : ""}`}>
                    <span className={`text-sm font-bold mb-2 ${isToday ? "text-indigo-600 bg-indigo-100 w-6 h-6 rounded-full flex items-center justify-center" : "text-gray-700"}`}>
                        {format(day, "d")}
                    </span>

                    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                        {absents.map((u) => (
                            <div 
                                key={u.id} 
                                className="flex items-center gap-1.5 bg-red-50 px-1.5 py-1 rounded border border-red-100 group relative"
                                title={u.reason || "Indisponible"} // Info-bulle native
                            >
                                <Avatar className="h-4 w-4">
                                    <AvatarImage src={u.user.image} />
                                    <AvatarFallback className="text-[8px]">{u.user.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-medium text-red-700 truncate max-w-[80px]">
                                        {u.user.name}
                                    </span>
                                    {/* Afficher la raison en tout petit si elle existe */}
                                    {u.reason && <span className="text-[8px] text-red-400 truncate">{u.reason}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                );
            })}
            </div>
        )}
      </div>
    </div>
  );
}