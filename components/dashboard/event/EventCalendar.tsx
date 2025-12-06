"use client";

import { useState } from "react";
import { format, isSameDay, startOfWeek, addWeeks, isWithinInterval } from "date-fns";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, CalendarCheck } from "lucide-react";
import { EventModal } from "../planning/EventModal"; // Réutilisation de la modale
import { useRouter } from "next/navigation";
import { Planing, PlaningWithIntercessor, SpecialEventWithPlaning } from "@/lib/types";
import { formatUtcDate, normalizeDate } from "@/lib/utils";

interface EventCalendarProps {
  specialEvent: SpecialEventWithPlaning;
 
}

export function EventCalendar({specialEvent }: EventCalendarProps) {
  // On commence le calendrier à la date de début de l'événement
  const today = normalizeDate(new Date())
  const eventStartDate = normalizeDate(new Date(specialEvent.startDate))
  const [currentDate, setCurrentDate] = useState(today > eventStartDate ? today : eventStartDate);
  const [selectedEvent, setSelectedEvent] = useState< PlaningWithIntercessor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();


  console.log(specialEvent)
  // Navigation
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(addWeeks(currentDate, -1));

  const handleRefresh = () => {
    router.refresh();
  };

  const handleEventClick = (evt: PlaningWithIntercessor, day: Date) => {
    setSelectedEvent(evt);
    setIsModalOpen(true);
    setCurrentDate(day)
  };

  // Générer les jours de la semaine affichée
  const days = [];
  let dayIter = startOfWeek(currentDate, { weekStartsOn: 1 });
  for(let i=0; i<7; i++) {
    days.push(normalizeDate(new Date(dayIter)));
    dayIter.setDate(dayIter.getDate() + 1);
  }

  return (
    <div className="space-y-6">
      
      {/* En-tête Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevWeek}><ChevronLeft className="h-4 w-4 "/></Button>
            <span className="font-semibold text-lg w-32 text-center capitalize">
                {formatUtcDate(currentDate, "MMMM yyyy")}
            </span>
            <Button variant="outline" size="icon" onClick={nextWeek}><ChevronRight className="h-4 w-4"/></Button>
        </div>
        <div className="text-sm text-gray-500 font-medium">
            Semaine du {formatUtcDate(days[0], "d")} au {formatUtcDate(days[6], "d MMM")}
        </div>
      </div>

      {/* Grille Semaine */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      <Button variant="outline" size="icon" onClick={prevWeek} className="md:hidden"><ChevronLeft className="h-4 w-4 "/></Button>
        {days.map((day) => {
            // Filtrer les événements pour ce jour
            const dayEvents = specialEvent.plannings.filter(e => isSameDay(e.date, day));
            dayEvents.sort((a,b) => {

                const [aH, aM] = a.startTime.split(":").map(Number);
                const [bH, bM] = b.startTime.split(":").map(Number);

                return aH - bH || aM - bM;
            })
            // Vérifier si le jour est DANS la période de l'événement
            const isEventDay = isWithinInterval(day, {
                start: normalizeDate(specialEvent.startDate),
                end: normalizeDate(specialEvent.endDate)
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
                            {formatUtcDate(day, "EEEE")}
                        </span>
                        <span className={`block text-xl font-bold ${isEventDay ? 'text-indigo-900' : 'text-gray-400'}`}>
                            {formatUtcDate(day, "d")}
                        </span>
                    </div>

                    {/* Créneaux */}
                    {dayEvents.map(evt => (
                        <Card 
                            key={evt.id}
                            onClick={() => handleEventClick(evt, day)}
                            className={`p-3 cursor-pointer hover:shadow-md transition-all border-l-4 text-left space-y-1 bg-white
                                `}
                        >
                            <div className="flex justify-between items-start">
                                <span className="font-semibold text-sm truncate w-full">{evt.title}</span>
                                <CalendarCheck className="h-3 w-3 text-pink-500 shrink-0 ml-1" />
                            </div>
                            <p className="text-xs text-gray-500">
                                {evt.startTime} - {evt.endTime}
                            </p>

                            {/* Avatars Intercesseurs */}
                            {evt.intercessors && evt.intercessors.length > 0 ? (
                                <div className="flex -space-x-2 overflow-hidden pt-2">
                                    {evt.intercessors.map((u: any) => (
                                        <div key={u.id} className="flex items-center gap-1">
                                            <Avatar key={u.id} className="inline-block h-4 w-4 rounded-full ring-2 ring-white">
                                                <AvatarImage src={u.image} />
                                                <AvatarFallback className="text-[9px] bg-indigo-100 text-indigo-700">
                                                    {u.name?.slice(0,1)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <p className="text-[8px]">{u.name}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center text-[10px] text-gray-400 mt-1 italic">
                                    Non assigné
                                </div>
                            )}
                        </Card>
                    ))}

                    
                </div>
            )
        })}
            <div className=" w-full flex justify-end">
                <Button variant="outline" size="icon" onClick={nextWeek} className="md:hidden self-center"><ChevronRight className="h-4 w-4"/></Button>
            </div>

      </div>

      <EventModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          event={selectedEvent}
          onRefresh={handleRefresh}
          date= {currentDate}
      />
    </div>
  );
}