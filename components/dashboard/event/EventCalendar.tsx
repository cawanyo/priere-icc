"use client";

import { useState } from "react";
import { format, isSameDay, startOfWeek, addWeeks, isWithinInterval, startOfDay } from "date-fns";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, CalendarCheck } from "lucide-react";
import { EventModal } from "../planning/EventModal"; // Réutilisation de la modale
import { useRouter } from "next/navigation";
import {  PlaningWithIntercessor, SpecialEventWithPlaning } from "@/lib/types";
import { formatUtcDate, normalizeDate } from "@/lib/utils";
import CalendarDay from "./CalendarDay";

interface EventCalendarProps {
  specialEvent: SpecialEventWithPlaning;
 
}

export function EventCalendar({specialEvent }: EventCalendarProps) {
  // On commence le calendrier à la date de début de l'événement
  const today = normalizeDate(new Date())
  const eventStartDate = normalizeDate(specialEvent.startDate)
  const eventEndDate = normalizeDate(specialEvent.endDate)


  const [currentDate, setCurrentDate] = useState(today > eventStartDate ? today : eventStartDate);
  const [selectedEvent, setSelectedEvent] = useState< PlaningWithIntercessor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();


  // Navigation
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(addWeeks(currentDate, -1));

  const handleRefresh = () => {
    router.refresh();
  };

  const handleEventClick = (evt: PlaningWithIntercessor, day: Date) => {
    setSelectedEvent(evt);
    setCurrentDate(day);
    setIsModalOpen(true);
    
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


        {days.map((day) => <CalendarDay key={day.toISOString()} specialEvent={specialEvent} handleEventClick={handleEventClick} day={day} /> )}


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