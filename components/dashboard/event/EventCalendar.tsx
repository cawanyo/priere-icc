"use client";

import { useState } from "react";
import { format, isSameDay, startOfWeek, addWeeks, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, CalendarCheck } from "lucide-react";
import { EventModal } from "../planning/EventModal"; // Réutilisation de la modale
import { useRouter } from "next/navigation";

interface EventCalendarProps {
  event: any;
  calendarData: any[];
}

export function EventCalendar({ event, calendarData }: EventCalendarProps) {
  // On commence le calendrier à la date de début de l'événement
  const [currentDate, setCurrentDate] = useState(new Date(event.startDate));
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // Navigation
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(addWeeks(currentDate, -1));

  const handleRefresh = () => {
    router.refresh();
  };

  const handleEventClick = (evt: any) => {
    setSelectedEvent(evt);
    setIsModalOpen(true);
  };

  // Générer les jours de la semaine affichée
  const days = [];
  let dayIter = startOfWeek(currentDate, { weekStartsOn: 1 }); // Lundi
  for(let i=0; i<7; i++) {
    days.push(new Date(dayIter));
    dayIter.setDate(dayIter.getDate() + 1);
  }

  return (
    <div className="space-y-6">
      
      {/* En-tête Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevWeek}><ChevronLeft className="h-4 w-4 "/></Button>
            <span className="font-semibold text-lg w-32 text-center capitalize">
                {format(currentDate, "MMMM yyyy", { locale: fr })}
            </span>
            <Button variant="outline" size="icon" onClick={nextWeek}><ChevronRight className="h-4 w-4"/></Button>
        </div>
        <div className="text-sm text-gray-500 font-medium">
            Semaine du {format(days[0], "d")} au {format(days[6], "d MMM", { locale: fr })}
        </div>
      </div>

      {/* Grille Semaine */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
      <Button variant="outline" size="icon" onClick={prevWeek} className="md:hidden"><ChevronLeft className="h-4 w-4 "/></Button>
        {days.map((day) => {
            // Filtrer les événements pour ce jour
            const dayEvents = calendarData.filter(e => isSameDay(new Date(e.startTime), day));
            
            // Vérifier si le jour est DANS la période de l'événement
            const isEventDay = isWithinInterval(day, {
                start: new Date(event.startDate),
                end: new Date(event.endDate)
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
                    {dayEvents.map(evt => (
                        <Card 
                            key={evt.id}
                            onClick={() => handleEventClick(evt)}
                            className={`p-3 cursor-pointer hover:shadow-md transition-all border-l-4 text-left space-y-1 bg-white
                                ${evt.isVirtual 
                                    ? 'border-l-gray-300 border-dashed opacity-80' 
                                    : 'border-l-pink-500'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <span className="font-semibold text-sm truncate w-full">{evt.title}</span>
                                {!evt.isVirtual && <CalendarCheck className="h-3 w-3 text-pink-500 shrink-0 ml-1" />}
                            </div>
                            <p className="text-xs text-gray-500">
                                {format(new Date(evt.startTime), "HH:mm")} - {format(new Date(evt.endTime), "HH:mm")}
                            </p>

                            {/* Avatars Intercesseurs */}
                            {evt.intercessors && evt.intercessors.length > 0 ? (
                                <div className="flex -space-x-2 overflow-hidden pt-2">
                                    {evt.intercessors.map((u: any) => (
                                        <Avatar key={u.id} className="inline-block h-6 w-6 rounded-full ring-2 ring-white">
                                            <AvatarImage src={u.image} />
                                            <AvatarFallback className="text-[9px] bg-indigo-100 text-indigo-700">
                                                {u.name?.slice(0,1)}
                                            </AvatarFallback>
                                        </Avatar>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center text-[10px] text-gray-400 mt-1 italic">
                                    Non assigné
                                </div>
                            )}
                        </Card>
                    ))}

                    {/* Bouton "+" (Uniquement si le jour fait partie de l'événement) */}
                    {isEventDay && (
                        <div 
                            className="flex-1 min-h-[40px] rounded hover:bg-gray-200/50 cursor-pointer flex items-center justify-center group transition-colors mt-2"
                            onClick={() => {
                                const start = new Date(day);
                                start.setHours(9, 0, 0, 0); 
                                const end = new Date(start);
                                end.setHours(10, 0, 0, 0);
                                setSelectedEvent({
                                    isVirtual: true,
                                    startTime: start,
                                    endTime: end,
                                    title: "Session Spéciale",
                                    intercessors: [],
                                    specialEventId: event.id // Lien crucial pour le backend
                                });
                                setIsModalOpen(true);
                            }}
                        >
                            <Plus className="h-4 w-4 text-gray-300 group-hover:text-gray-500" />
                        </div>
                    )}
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
      />
    </div>
  );
}