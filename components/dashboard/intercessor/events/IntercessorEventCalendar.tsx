"use client";

import { useState } from "react";
import { format, isSameDay, startOfWeek, addWeeks, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarCheck, UserCheck, Filter } from "lucide-react";

interface IntercessorEventCalendarProps {
  event: any;
  calendarData: any[];
  currentUserId: string;
}

export function IntercessorEventCalendar({ event, calendarData, currentUserId }: IntercessorEventCalendarProps) {
  // On commence sur la date de début de l'événement
  const [currentDate, setCurrentDate] = useState(new Date(event.startDate));
  const [showMyPlanningOnly, setShowMyPlanningOnly] = useState(false); // ÉTAT FILTRE

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
      
      {/* En-tête Navigation & Filtres */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevWeek}><ChevronLeft className="h-4 w-4"/></Button>
            <span className="font-semibold text-lg w-32 text-center capitalize">
                {format(currentDate, "MMMM yyyy", { locale: fr })}
            </span>
            <Button variant="outline" size="icon" onClick={nextWeek}><ChevronRight className="h-4 w-4"/></Button>
        </div>

        <div className="flex items-center gap-4">
             {/* Légende */}
             {!showMyPlanningOnly && (
                <div className="hidden sm:flex flex-wrap gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-pink-100 border border-pink-200 rounded-sm"></span>
                        Mes créneaux
                    </span>
                </div>
            )}

            {/* BOUTON FILTRE */}
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
        {days.map((day) => {
            const isEventDay = isWithinInterval(day, {
                start: new Date(event.startDate),
                end: new Date(event.endDate)
            });

            // FILTRE DES ÉVÉNEMENTS
            const dayEvents = calendarData.filter(e => {
                const isDayMatch = isSameDay(new Date(e.startTime), day);
                if (!showMyPlanningOnly) return isDayMatch;
                
                // Si filtre actif : on ne garde que si l'user est assigné
                const isAssigned = e.intercessors?.some((u: any) => u.id === currentUserId);
                return isDayMatch && isAssigned;
            });

            return (
                <div 
                    key={day.toISOString()} 
                    className={`flex flex-col gap-3 min-h-[200px] rounded-xl p-3 border transition-colors
                        ${isEventDay ? 'bg-gray-50/50 border-gray-100' : 'bg-gray-100/30 border-transparent opacity-50'}`}
                >
                    {/* En-tête Jour */}
                    <div className="text-center mb-2">
                        <span className="block text-xs font-semibold text-gray-500 uppercase">
                            {format(day, "EEEE", { locale: fr })}
                        </span>
                        <span className={`block text-xl font-bold ${isEventDay ? 'text-indigo-900' : 'text-gray-400'}`}>
                            {format(day, "d")}
                        </span>
                    </div>

                    {/* Créneaux */}
                    {dayEvents.map(evt => {
                        const isAssigned = evt.intercessors?.some((u: any) => u.id === currentUserId);
                        const isVirtual = evt.isVirtual;

                        return (
                            <Card 
                                key={evt.id}
                                className={`p-3 text-left space-y-1 border-l-4 shadow-sm
                                    ${isAssigned 
                                        ? 'border-l-pink-500 bg-pink-50/40 border-pink-100 ring-1 ring-pink-100' 
                                        : isVirtual 
                                            ? 'border-l-gray-300 border-dashed opacity-70 bg-white' 
                                            : 'border-l-indigo-300 border-gray-100 bg-white'
                                    }`}
                            >
                                <div className="flex justify-between items-start gap-1">
                                    <span className={`font-semibold text-sm truncate w-full ${isAssigned ? 'text-pink-900' : 'text-gray-900'}`}>
                                        {evt.title}
                                    </span>
                                    {isAssigned && <UserCheck className="h-3 w-3 text-pink-600 shrink-0" />}
                                    {!isAssigned && !isVirtual && <CalendarCheck className="h-3 w-3 text-indigo-400 shrink-0" />}
                                </div>
                                <p className="text-xs text-gray-500">
                                    {format(new Date(evt.startTime), "HH:mm")} - {format(new Date(evt.endTime), "HH:mm")}
                                </p>

                                {/* Avatars */}
                                {evt.intercessors && evt.intercessors.length > 0 && !showMyPlanningOnly && (
                                    <div className="flex -space-x-2 overflow-hidden pt-2">
                                        {evt.intercessors.map((u: any) => (
                                            <Avatar key={u.id} className={`inline-block h-6 w-6 rounded-full ring-2 ${isAssigned ? 'ring-pink-50' : 'ring-white'}`}>
                                                <AvatarImage src={u.image} />
                                                <AvatarFallback className="text-[9px] bg-indigo-100 text-indigo-700">
                                                    {u.name?.slice(0,1)}
                                                </AvatarFallback>
                                            </Avatar>
                                        ))}
                                    </div>
                                )}
                                {/* Indicateur pour les créneaux virtuels vides */}
                                {isVirtual && !isAssigned && (
                                    <div className="text-[10px] text-gray-400 mt-1 italic">Non assigné</div>
                                )}
                            </Card>
                        )
                    })}
                    
                    {dayEvents.length === 0 && isEventDay && showMyPlanningOnly && (
                        <p className="text-center text-xs text-gray-300 py-4">Rien ce jour</p>
                    )}
                </div>
            )
        })}
      </div>
    </div>
  );
}