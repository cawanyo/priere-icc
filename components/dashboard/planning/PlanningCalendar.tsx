"use client";

import { useState, useEffect } from "react";
import { startOfWeek, endOfWeek, addWeeks, format, isSameDay, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Repeat, Users } from "lucide-react";
import { EventModal } from "./EventModal";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPlanningEvents } from "@/app/actions/planing"; // Vérifiez l'orthographe (planning vs planing)
import { RecurringManager } from "./RecurringManager";

import { PlaningWithIntercessor } from "@/lib/types";
import { convertKeepDate } from "@/lib/utils";

export function PlanningCalendar() {
  // On normalise dès l'initialisation pour éviter les décalages jour J
  const [currentDate, setCurrentDate] = useState(() => new Date());


  
  const [events, setEvents] = useState<PlaningWithIntercessor[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  
  // Date passée à la modale (doit être normalisée)
  const [modalDate, setModalDate] = useState(() => new Date());

  const startOfWeekDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endOfWeekDate = endOfWeek(currentDate, { weekStartsOn: 1 });

  // Charger les données de la semaine
  const loadEvents = async () => {
    // startOfWeek renvoie une date locale, on l'utilise telle quelle pour la requête
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); 
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    
    const res = await getPlanningEvents(start.toDateString(), end.toDateString());
    if (res.success) {
        setEvents(res.data);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

 
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(addWeeks(currentDate, -1));

  // Création via le bouton principal (date d'aujourd'hui par défaut)
  const handleCreateNew = () => {
    setSelectedEvent(null);
    setModalDate(new Date());
    setIsModalOpen(true);
  };

  // Clic sur un événement ou une case vide (+ dans la case)
  const handleEventClick = (event: any, day: Date) => {
    // 1. On définit l'événement (ou null si c'est une création)
    setSelectedEvent(event);
    
    // 2. On force la date normalisée (UTC visuel) pour la modale
    const normalizedDay = day;
    setModalDate(normalizedDay);
    
    // 3. On ouvre
    setIsModalOpen(true);
  };

  // Génération propre des 7 jours de la semaine
  const days = Array.from({ length: 7 }).map((_, i) => {
    // On prend le lundi de la semaine courante et on ajoute i jours
    return addDays(startOfWeekDate, i);
  });

  return (
    <div className="space-y-6">
        
        {/* Contrôles */}
        <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="icon" onClick={prevWeek}><ChevronLeft className="h-4 w-4"/></Button>
                <span className="font-semibold text-lg w-32 text-center capitalize">
                    {format(currentDate, "MMMM yyyy")}
                </span>
                <Button variant="outline" size="icon" onClick={nextWeek}><ChevronRight className="h-4 w-4"/></Button>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {/* <DownloadPlanningButton 
                    events={events}
                    title="Planning Hebdomadaire"
                    subtitle={`Semaine du ${formatUtcDate(startOfWeekDate, "d MMMM")} au ${formatUtcDate(endOfWeekDate, "d MMMM yyyy")}`}
                    startDate={startOfWeekDate}
                    endDate={endOfWeekDate}
                    fileName={`planning-semaine-${format(startOfWeekDate, "ww")}.pdf`}
                /> */}

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
            <Button variant="outline" size="icon" onClick={prevWeek} className="md:hidden"><ChevronLeft className="h-4 w-4"/></Button>

            {days.map((day) => {
                // Comparaison avec date normalisée
                const dayEvents = events.filter(e => isSameDay(convertKeepDate(e.date), day));
                
                // Comparaison "Is Today" (on normalise new Date() pour être sûr)
                const isToday = isSameDay(day, new Date());

                return (
                    <div key={day.toISOString()} className={`flex flex-col gap-3 min-h-[200px] rounded-xl p-3 ${isToday ? 'bg-pink-50/50 border-pink-100 border' : 'bg-gray-50 border border-transparent'}`}>
                        {/* En-tête jour */}
                        <div className="text-center mb-2">
                            <span className="block text-xs font-semibold text-gray-500 uppercase">
                                {format(day, "EEEE")}
                            </span>
                            <span className={`block text-xl font-bold ${isToday ? 'text-pink-600' : 'text-gray-700'}`}>
                                {format(day, "d")}
                            </span>
                        </div>

                        {/* Événements */}
                        {dayEvents.map((evt) => (
                            <Card 
                                key={evt.id} 
                                // Important : on passe 'day' (la date de la colonne) pour être sûr de la date
                                onClick={() => handleEventClick(evt, day)}
                                className="p-3 cursor-pointer hover:shadow-md transition-all border-l-4 text-left space-y-2"
                            >
                                <div>
                                    <p className="font-semibold text-sm text-gray-900 truncate">{evt.title}</p>
                                    <p className="text-xs text-gray-500">
                                        {`${evt.startTime} - ${evt.endTime} `}
                                    </p>
                                </div>
                                
                                {evt.intercessors && evt.intercessors.length > 0 ? (
                                    <div className="flex -space-x-2 overflow-x-auto pt-1 no-scrollbar">
                                        {evt.intercessors.map((u: any) => (
                                            <div className="flex items-center gap-1" key={u.id}>
                                                <Avatar className="inline-block h-6 w-6 rounded-full ring-2 ring-white">
                                                    <AvatarImage src={u.image} />
                                                    <AvatarFallback className="text-[9px] bg-indigo-100 text-indigo-700">
                                                        {u.name?.slice(0,1)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {/* Optionnel: afficher le nom si besoin, sinon l'avatar suffit */}
                                                {/* <p className="text-[9px]">{u.name.slice(0, 10)}</p> */}
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
                        
                        {/* Zone vide cliquable pour ajouter (Créer un event CE jour là) */}
                        <div 
                            className="flex-1 min-h-[50px] rounded hover:bg-gray-100/50 cursor-pointer flex items-center justify-center group"
                            onClick={() => handleEventClick(null, day)}
                        >
                            <Plus className="h-5 w-5 text-gray-300 group-hover:text-gray-400" />
                        </div>
                    </div>
                );
            })}
            
            <div className="flex justify-end md:hidden">
                <Button variant="outline" size="icon" onClick={nextWeek}><ChevronRight className="h-4 w-4"/></Button>
            </div>
        </div>

        <EventModal 
            date={modalDate}
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