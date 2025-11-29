"use client";

import { useState, useEffect } from "react";
import { startOfWeek, endOfWeek, addWeeks, format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon, Users, Repeat } from "lucide-react";
import { EventModal } from "./EventModal";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getPlanningEvents } from "@/app/actions/planing";
import { RecurringManager } from "./RecurringManager";

export function PlanningCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);

  // Charger les données de la semaine
  const loadEvents = async () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Lundi
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    
    const res = await getPlanningEvents(start, end);
    if (res.success) {
        setEvents(res.data);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  // Navigation
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(addWeeks(currentDate, -1));

  // Création d'un nouvel événement vierge
  const handleCreateNew = () => {
    const start = new Date(currentDate);
    start.setHours(9, 0, 0, 0); // Par défaut 9h aujourd'hui (ou début de semaine)
    const end = new Date(start);
    end.setHours(10, 0, 0, 0);

    setSelectedEvent({
        isVirtual: true, // Considéré comme nouveau
        startTime: start,
        endTime: end,
        title: "",
        intercessors: []
    });
    setIsModalOpen(true);
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  // Groupement par jour pour l'affichage
  const days = [];
  let dayIter = startOfWeek(currentDate, { weekStartsOn: 1 });
  for(let i=0; i<7; i++) {
    days.push(new Date(dayIter));
    dayIter = addWeeks(dayIter, 0); // Astuce pour cloner ou addDays(dayIter, 1)
    dayIter.setDate(dayIter.getDate() + 1);
  }

  return (
    <div className="space-y-6">
        
        {/* Contrôles */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={prevWeek}><ChevronLeft className="h-4 w-4"/></Button>
                <span className="font-semibold text-lg w-32 text-center">
                    {format(currentDate, "MMMM yyyy", { locale: fr })}
                </span>
                <Button variant="outline" size="icon" onClick={nextWeek}><ChevronRight className="h-4 w-4"/></Button>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                {/* BOUTON AJOUTÉ ICI */}
                <Button 
                    variant="outline" 
                    onClick={() => setIsRecurringOpen(true)}
                    className="flex-1 md:flex-none border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                    <Repeat className="mr-2 h-4 w-4" /> Gérer la récurrence
                </Button>

                <Button onClick={handleCreateNew} className="flex-1 md:flex-none bg-indigo-900 hover:bg-indigo-800">
                    <Plus className="mr-2 h-4 w-4" /> Nouveau Créneau
                </Button>
            </div>
        </div>

        {/* Grille Semaine */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {days.map((day) => {
                const dayEvents = events.filter(e => isSameDay(new Date(e.startTime), day));
                const isToday = isSameDay(day, new Date());

                return (
                    <div key={day.toISOString()} className={`flex flex-col gap-3 min-h-[200px] rounded-xl p-3 ${isToday ? 'bg-pink-50/50 border-pink-100 border' : 'bg-gray-50 border border-transparent'}`}>
                        {/* En-tête jour */}
                        <div className="text-center mb-2">
                            <span className="block text-xs font-semibold text-gray-500 uppercase">
                                {format(day, "EEEE", { locale: fr })}
                            </span>
                            <span className={`block text-xl font-bold ${isToday ? 'text-pink-600' : 'text-gray-700'}`}>
                                {format(day, "d")}
                            </span>
                        </div>

                        {/* Événements */}
                        {dayEvents.map((evt) => (
                            <Card 
                                key={evt.id} 
                                onClick={() => handleEventClick(evt)}
                                className={`p-3 cursor-pointer hover:shadow-md transition-all border-l-4 text-left space-y-2 ${evt.isVirtual ? 'border-l-gray-300 opacity-70 border-dashed border' : 'border-l-indigo-500 border-indigo-100'}`}
                            >
                                <div>
                                    <p className="font-semibold text-sm text-gray-900 truncate">{evt.title}</p>
                                    <p className="text-xs text-gray-500">
                                        {format(new Date(evt.startTime), "HH:mm")} - {format(new Date(evt.endTime), "HH:mm")}
                                    </p>
                                </div>
                                
                                {evt.intercessors && evt.intercessors.length > 0 ? (
                                    <div className="flex -space-x-2 overflow-scroll pt-1">
                                        {evt.intercessors.map((u: any) => (
                                            <div className="flex items-center gap-1" key={u.id}>
                                                <Avatar key={u.id} className="inline-block h-6 w-6 rounded-full ring-2 ring-white">
                                                    <AvatarImage src={u.image} />
                                                    <AvatarFallback className="text-[9px] bg-indigo-100 text-indigo-700">
                                                        {u.name.slice(0,1)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <p className=" text-[9px]">{u.name.slice(0, 20)}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center text-[10px] text-red-400 font-medium">
                                        <Users className="h-3 w-3 mr-1" /> À pourvoir
                                    </div>
                                )}
                            </Card>
                        ))}
                        
                        {/* Zone vide cliquable pour ajouter */}
                        <div 
                            className="flex-1 min-h-[50px] rounded hover:bg-gray-100/50 cursor-pointer flex items-center justify-center group"
                            onClick={() => {
                                const start = new Date(day);
                                start.setHours(12, 0, 0, 0);
                                const end = new Date(start);
                                end.setHours(13, 0, 0, 0);
                                setSelectedEvent({ isVirtual: true, startTime: start, endTime: end, title: "Nouveau", intercessors: [] });
                                setIsModalOpen(true);
                            }}
                        >
                            <Plus className="h-5 w-5 text-gray-300 group-hover:text-gray-400" />
                        </div>
                    </div>
                );
            })}
        </div>

        <EventModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            event={selectedEvent} 
            onRefresh={loadEvents}
        />

        <RecurringManager
            isOpen={isRecurringOpen}
            onClose={() => setIsRecurringOpen(false)}
            onRefresh={loadEvents}
        />
    </div>
  );
}