"use client";

import { useState, useEffect } from "react";
import { getIntercessorPlanning } from "@/app/actions/intercessor";
import { startOfWeek, endOfWeek, addWeeks, format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, UserCheck, Repeat, Filter } from "lucide-react"; // Ajout icône Filter
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaningWithIntercessor } from "@/lib/types";

export function IntercessorCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<PlaningWithIntercessor[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showMyPlanningOnly, setShowMyPlanningOnly] = useState(false); // NOUVEL ÉTAT

  const loadEvents = async () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    
    const res = await getIntercessorPlanning(start, end);
    if (res.success) {
        setEvents(res.data ?? []);
        setCurrentUserId(res.currentUserId?? "");
    }
  };

  useEffect(() => {
    loadEvents();
  }, [currentDate]);
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(addWeeks(currentDate, -1));

  const days = [];
  let dayIter = startOfWeek(currentDate, { weekStartsOn: 1 });
  for(let i=0; i<7; i++) {
    days.push(new Date(dayIter));
    dayIter.setDate(dayIter.getDate() + 1);
  }

  return (
    <div className="space-y-6">
        
        {/* En-tête Navigation */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={prevWeek}><ChevronLeft className="h-4 w-4"/></Button>
                <span className="font-semibold text-lg w-32 text-center capitalize">
                    {format(currentDate, "MMMM yyyy", { locale: fr })}
                </span>
                <Button variant="outline" size="icon" onClick={nextWeek}><ChevronRight className="h-4 w-4"/></Button>
            </div>
            
            <div className="flex items-center gap-4">
                {/* Légende (Masquée si filtre actif pour épuré) */}
                {!showMyPlanningOnly && (
                    <div className="hidden sm:flex flex-wrap gap-4 text-xs sm:text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 bg-pink-100 border border-pink-200 rounded-sm"></span>
                            Mes créneaux
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 border border-gray-300 border-dashed bg-gray-50 rounded-sm"></span>
                            Programmes récurrents
                        </span>
                    </div>
                )}

                {/* BOUTON FILTRE AJOUTÉ ICI */}
                <Button 
                    variant={showMyPlanningOnly ? "default" : "outline"}
                    className={showMyPlanningOnly ? "bg-pink-600 hover:bg-pink-700 text-white" : "text-gray-600"}
                    onClick={() => setShowMyPlanningOnly(!showMyPlanningOnly)}
                >
                    <Filter className="mr-2 h-4 w-4" />
                    {showMyPlanningOnly ? "Voir tout le planning" : "Voir mes créneaux"}
                </Button>
            </div>
        </div>

        {/* Grille Semaine */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            <Button variant="outline" size="icon" onClick={prevWeek} className="md:hidden"><ChevronLeft className="h-4 w-4"/></Button>
            {days.map((day) => {
                // LOGIQUE DE FILTRE MISE À JOUR
                const dayEvents = events.filter(e => {
                    const isTodayEvent = isSameDay(e.date, day);
                    if (!showMyPlanningOnly) return isTodayEvent; // Si pas de filtre, on garde tout
                    
                    // Si filtre actif, on garde seulement si l'user est assigné
                    const isAssigned = e.intercessors?.some((u: any) => u.id === currentUserId);
                    return isTodayEvent && isAssigned;
                });

                const isToday = isSameDay(day, new Date());

                return (
                    <div key={day.toISOString()} className={`flex flex-col gap-3 min-h-[150px] rounded-xl p-3 ${isToday ? 'bg-indigo-50/50 border-indigo-100 border' : 'bg-gray-50 border border-transparent'}`}>
                        {/* En-tête jour */}
                        <div className="text-center mb-2">
                            <span className="block text-xs font-semibold text-gray-500 uppercase">
                                {format(day, "EEEE", { locale: fr })}
                            </span>
                            <span className={`block text-xl font-bold ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
                                {format(day, "d")}
                            </span>
                        </div>

                        {/* Événements */}
                        {dayEvents.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center">
                                <span className="text-xs text-gray-300 italic">-</span>
                            </div>
                        ) : (
                            dayEvents.map((evt) => {
                                const isAssigned = evt.intercessors?.some((u: any) => u.id === currentUserId);

                                return (
                                    <Card 
                                        key={evt.id} 
                                        className={`p-3 text-left space-y-2 border-l-4 shadow-sm transition-all
                                            ${isAssigned 
                                                ? 'border-l-pink-500 bg-pink-50/40 border-pink-100 ring-1 ring-pink-100' 

                                                    : 'border-l-indigo-300 border-gray-100'
                                            }`}
                                    >
                                        <div>
                                            <div className="flex justify-between items-start gap-1">
                                                <p className={`font-semibold text-sm truncate ${isAssigned ? 'text-pink-900' : 'text-gray-900'}`}>
                                                    {evt.title}
                                                </p>
                                                {isAssigned && <UserCheck className="h-3 w-3 text-pink-600 shrink-0" />}
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                                                {evt.startTime} - {evt.endTime}
                                            </p>
                                        </div>
                                        
                                        {/* Avatars (Masqués si filtre "Mes créneaux" actif pour alléger, ou gardés selon préférence) */}
                                        {evt.intercessors && evt.intercessors.length > 0 && (
                                            <div className="flex -space-x-2 overflow-hidden pt-1">
                                                {evt.intercessors.map((u: any) => (
                                                    <div className="flex items-center gap-1" key={u.id}>
                                                        <Avatar key={u.id} className={`inline-block h-6 w-6 rounded-full ring-2 ${isAssigned ? 'ring-pink-50' : 'ring-white'}`}>
                                                            <AvatarImage src={u.image} />
                                                            <AvatarFallback className="text-[9px] bg-indigo-100 text-indigo-700">
                                                                {u.name?.slice(0,1)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <p className=" text-[9px]">{u.name.slice(0, 20)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </Card>
                                )
                            })
                        )}
                    </div>
                );
            })}
            <div className="flex justify-end md:hidden">
                <Button variant="outline" size="icon" onClick={nextWeek}><ChevronRight className="h-4 w-4"/></Button>
            </div>
        </div>
    </div>
  );
}