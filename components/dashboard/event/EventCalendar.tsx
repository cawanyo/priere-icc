"use client";

import { useState, useMemo } from "react";
import { format, isSameDay, isWithinInterval, startOfDay, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Users,
  ChevronRight,
  ChevronLeft,
  Filter,
  Plus,
  Edit,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { EventModal } from "../planning/EventModal";
import { PlaningWithIntercessor, SpecialEventWithPlaning } from "@/lib/types";
import { convertKeepDate, cn } from "@/lib/utils";
import Link from "next/link";

interface EventCalendarProps {
  specialEvent: SpecialEventWithPlaning;
}

export function EventCalendar({ specialEvent }: EventCalendarProps) {
  const router = useRouter();

  const eventStartDate = convertKeepDate(specialEvent.startDate);
  const eventEndDate = convertKeepDate(specialEvent.endDate);
  const today = new Date();

  // Liste ordonnée de tous les jours de l'événement
  const eventDays = useMemo(() => {
    const days: Date[] = [];
    let current = startOfDay(eventStartDate);
    const end = startOfDay(eventEndDate);

    while (current <= end) {
      days.push(new Date(current));
      current = addDays(current, 1);
    }
    return days;
  }, [eventStartDate, eventEndDate]);

  // Jour sélectionné par défaut : aujourd'hui si dans l'intervalle, sinon premier jour
  const defaultDay = useMemo(() => {
    const isTodayInEvent = isWithinInterval(startOfDay(today), {
      start: startOfDay(eventStartDate),
      end: startOfDay(eventEndDate),
    });
    return isTodayInEvent ? startOfDay(today) : (eventDays[0] || startOfDay(eventStartDate));
  }, [today, eventStartDate, eventEndDate, eventDays]);

  const [selectedDay, setSelectedDay] = useState<Date>(defaultDay);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<PlaningWithIntercessor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Statistiques globales de l'événement
  const totalSlotsCount = specialEvent.plannings?.length || 0;
  const assignedSlotsCount = useMemo(() => {
    return (specialEvent.plannings || []).filter(
      (p) => p.users && p.users.length > 0
    ).length;
  }, [specialEvent.plannings]);

  // Créneaux pour le jour sélectionné
  const daySlots = useMemo(() => {
    const slots = (specialEvent.plannings || []).filter((slot) => {
      const isDayMatch = isSameDay(convertKeepDate(slot.date), selectedDay);
      if (!isDayMatch) return false;
      if (showUnassignedOnly) {
        return !slot.users || slot.users.length === 0;
      }
      return true;
    });

    return slots.sort((a, b) => {
      const [aH, aM] = a.startTime.split(":").map(Number);
      const [bH, bM] = b.startTime.split(":").map(Number);
      return aH - bH || aM - bM;
    });
  }, [specialEvent.plannings, selectedDay, showUnassignedOnly]);

  const handleOpenSlot = (slot: PlaningWithIntercessor) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const handleCreateSlot = () => {
    setSelectedSlot(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Carte Héros Sobre (Identique visuellement à la page utilisateur) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
                <CalendarIcon className="h-3 w-3 text-slate-500" />
                Du {format(eventStartDate, "d MMMM", { locale: fr })} au {format(eventEndDate, "d MMMM yyyy", { locale: fr })}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
              {specialEvent.title}
            </h1>

            {specialEvent.description && (
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                {specialEvent.description}
              </p>
            )}
          </div>

          {/* Stats et Actions Leader */}
          <div className="flex flex-wrap items-center gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
            <div className="text-left sm:text-right pr-2">
              <span className="text-[11px] text-slate-400 font-medium block">
                Couverture planning
              </span>
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 sm:justify-end">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {assignedSlotsCount} / {totalSlotsCount} pourvus
              </span>
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold rounded-xl cursor-pointer"
            >
              <Link href={`/dashboard/leader/events/${specialEvent.id}/edit`}>
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Modifier l&apos;événement
              </Link>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowUnassignedOnly(!showUnassignedOnly)}
              className={cn(
                "h-8 text-xs font-semibold rounded-xl transition-all cursor-pointer",
                showUnassignedOnly
                  ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                  : "text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              {showUnassignedOnly ? "Tous les créneaux" : "Non pourvus"}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Carrousel horizontal de sélection des dates */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Choisir une date
          </span>
          <span className="text-xs text-indigo-600 font-medium">
            {eventDays.length} jours au total
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 px-0.5 no-scrollbar scroll-smooth">
          {eventDays.map((day) => {
            const isSelected = isSameDay(day, selectedDay);

            const countForDay = (specialEvent.plannings || []).filter((p) =>
              isSameDay(convertKeepDate(p.date), day)
            ).length;

            const unassignedForDay = (specialEvent.plannings || []).filter(
              (p) => isSameDay(convertKeepDate(p.date), day) && (!p.users || p.users.length === 0)
            ).length;

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[70px] sm:min-w-[80px] py-2.5 px-2 rounded-2xl border transition-all cursor-pointer relative shrink-0",
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10 scale-102"
                    : "bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700 shadow-xs"
                )}
              >
                {/* Pastille créneaux non pourvus */}
                {unassignedForDay > 0 && (
                  <span
                    className={cn(
                      "absolute top-1.5 right-1.5 h-2 w-2 rounded-full",
                      isSelected ? "bg-amber-400 ring-2 ring-slate-900" : "bg-amber-500"
                    )}
                    title={`${unassignedForDay} créneau(x) sans conducteur`}
                  />
                )}

                <span
                  className={cn(
                    "text-[10px] uppercase font-bold tracking-wider",
                    isSelected ? "text-slate-300" : "text-slate-400"
                  )}
                >
                  {format(day, "EEE", { locale: fr })}
                </span>

                <span className="text-base sm:text-lg font-bold leading-tight mt-0.5">
                  {format(day, "d")}
                </span>

                <span
                  className={cn(
                    "text-[9px] mt-0.5 font-medium px-1.5 py-0.2 rounded-full",
                    isSelected
                      ? "bg-white/20 text-white"
                      : countForDay > 0
                      ? "bg-slate-100 text-slate-600"
                      : "text-slate-300"
                  )}
                >
                  {countForDay} {countForDay > 1 ? "créneaux" : "créneau"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Entête du Jour Sélectionné avec bouton "+ Nouveau créneau" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
            {format(selectedDay, "d")}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 capitalize leading-snug">
              {format(selectedDay, "EEEE d MMMM yyyy", { locale: fr })}
            </h2>
            <p className="text-[11px] text-slate-500">
              {daySlots.length} créneau{daySlots.length > 1 ? "x" : ""}{" "}
              {showUnassignedOnly ? "non pourvu(s)" : "au planning"}
            </p>
          </div>
        </div>

        {/* Actions du jour : Ajouter créneau + Navigation */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            size="sm"
            onClick={handleCreateSlot}
            className="h-8 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Nouveau créneau
          </Button>

          <div className="flex items-center gap-1 border-l border-slate-100 pl-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl cursor-pointer"
              onClick={() => setSelectedDay(addDays(selectedDay, -1))}
              disabled={isSameDay(selectedDay, eventDays[0] || eventStartDate)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl cursor-pointer"
              onClick={() => setSelectedDay(addDays(selectedDay, 1))}
              disabled={isSameDay(selectedDay, eventDays[eventDays.length - 1] || eventEndDate)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Liste Présentation des Créneaux du Jour */}
      {daySlots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Clock className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            {showUnassignedOnly
              ? "Tous les créneaux de cette journée ont au moins un conducteur assigné !"
              : "Aucun créneau planifié pour cette journée."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCreateSlot}
            className="text-xs rounded-xl gap-1.5 font-medium cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter un créneau pour ce jour
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {daySlots.map((slot) => {
            const slotUsers = slot.users || [];
            const isAssigned = slotUsers.length > 0;

            return (
              <div
                key={slot.id}
                onClick={() => handleOpenSlot(slot as any)}
                className="group relative flex flex-col justify-between p-4 rounded-2xl border bg-white hover:bg-slate-50 border-slate-200/80 transition-all cursor-pointer shadow-xs hover:shadow-sm"
              >
                {/* Ligne du haut : Horaires & Statut */}
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    {slot.startTime} - {slot.endTime}
                  </span>

                  {isAssigned ? (
                    <Badge variant="outline" className="text-slate-700 border-slate-200 text-[11px] font-medium rounded-lg bg-slate-50/50">
                      <Users className="h-3 w-3 mr-1 text-slate-500" />
                      {slotUsers.length} conducteur{slotUsers.length > 1 ? "s" : ""}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 text-[11px] font-semibold rounded-lg gap-1">
                      <AlertCircle className="h-3 w-3" />
                      À pourvoir
                    </Badge>
                  )}
                </div>

                {/* Titre et détails du créneau */}
                <div className="my-3">
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-950 transition-colors">
                    {slot.title}
                  </h3>
                  {slot.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {slot.description}
                    </p>
                  )}
                </div>

                {/* Ligne du bas : Intercesseurs inscrits + Bouton d'action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  {/* Visages des participants */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    {slotUsers.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-2 overflow-hidden">
                          {slotUsers.slice(0, 3).map((u: any) => (
                            <Avatar key={u.id} className="h-6 w-6 border-2 border-white shadow-xs">
                              <AvatarImage src={u.image} />
                              <AvatarFallback className="text-[9px] bg-indigo-100 text-indigo-700 font-bold">
                                {u.name?.slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span className="text-[11px] text-slate-500 truncate max-w-[120px] sm:max-w-[150px]">
                          {slotUsers.map((u: any) => u.name?.split(" ")[0]).join(", ")}
                          {slotUsers.length > 3 && ` +${slotUsers.length - 3}`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-amber-700/80 italic">
                        Aucun conducteur assigné
                      </span>
                    )}
                  </div>

                  {/* Bouton d'action sobre */}
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors flex items-center gap-1 shrink-0">
                    <Edit className="h-3 w-3" />
                    Modifier
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale d'édition / création de créneau sobre et belle */}
      <EventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        event={selectedSlot}
        onRefresh={handleRefresh}
        date={selectedDay}
        specialEventId={specialEvent.id}
      />
    </div>
  );
}
