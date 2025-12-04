"use client";

import { useState, useEffect } from "react";
import { startOfWeek, endOfWeek, addWeeks, format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon, Users, Repeat } from "lucide-react";
import { EventModal } from "./EventModal";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPlanningEvents } from "@/app/actions/planing";
import { RecurringManager } from "./RecurringManager";
import { DownloadPlanningButton } from "@/components/pdf/DownloadPlanningButton"; // Import du bouton
import { PlaningWithIntercessor } from "@/lib/types";
export function PlanningCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<PlaningWithIntercessor[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  const [modalDate, setModalDate] = useState(new Date())

  const startOfWeekDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endOfWeekDate = endOfWeek(currentDate, { weekStartsOn: 1 });

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


  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(addWeeks(currentDate, -1));

  // Création d'un nouvel événement vierge
  const handleCreateNew = () => {
    setModalDate(new Date())
    console.log(new Date(), modalDate)
    setIsModalOpen(true);
  };

  const handleEventClick = (event: any, day: Date) => {
    setSelectedEvent(event);
    setModalDate(day)
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
        <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="icon" onClick={prevWeek}><ChevronLeft className="h-4 w-4"/></Button>
                <span className="font-semibold text-lg w-32 text-center">
                    {format(currentDate, "MMMM yyyy", { locale: fr })}
                </span>
                <Button variant="outline" size="icon" onClick={nextWeek}><ChevronRight className="h-4 w-4"/></Button>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {/* BOUTON AJOUTÉ ICI */}
                <DownloadPlanningButton 
                    events={events} // On passe la liste des événements récupérés
                    title="Planning Hebdomadaire"
                    subtitle={`Semaine du ${format(startOfWeekDate, "d MMMM", { locale: fr })} au ${format(endOfWeekDate, "d MMMM yyyy", { locale: fr })}`}
                    startDate={startOfWeekDate}
                    endDate={endOfWeekDate}
                    fileName={`planning-semaine-${format(startOfWeekDate, "ww")}.pdf`}
                />

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
                const dayEvents = events.filter(e => isSameDay(e.date, day));
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
                                onClick={() => handleEventClick(evt, evt.date)}
                                className={`p-3 cursor-pointer hover:shadow-md transition-all border-l-4 text-left space-y-2 `}
                            >
                                <div>
                                    <p className="font-semibold text-sm text-gray-900 truncate">{evt.title}</p>
                                    <p className="text-xs text-gray-500">
                                        {`${evt.startTime} - ${evt.endTime} `}
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
            date = {modalDate}
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