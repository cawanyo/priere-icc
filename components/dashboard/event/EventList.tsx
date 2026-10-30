"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus, Calendar, ArrowRight, Trash2, MoreVertical, Edit,
  CalendarDays,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteSpecialEvent } from "@/app/actions/event";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { EventFormModal } from "./EventFormModal";
import { SpecialEventWithTemplate } from "@/lib/types";
import { convertKeepDate, cn } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type EventStatus = "ONGOING" | "UPCOMING" | "PAST";

function getEventStatus(startDate: Date | string, endDate: Date | string): EventStatus {
  try {
    const start = convertKeepDate(new Date(startDate));
    const end = convertKeepDate(new Date(endDate));
    const now = new Date();

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const eventEndDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
    const eventStartDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);

    if (eventEndDay.getTime() < todayStart.getTime()) {
      return "PAST";
    }
    if (eventStartDay.getTime() <= todayStart.getTime()) {
      return "ONGOING";
    }
    return "UPCOMING";
  } catch {
    return "UPCOMING";
  }
}

function formatEventDates(startDate: Date | string, endDate: Date | string): string {
  try {
    const start = convertKeepDate(new Date(startDate));
    const end = convertKeepDate(new Date(endDate));
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (startYear === endYear) {
      if (start.getMonth() === end.getMonth() && start.getDate() === end.getDate()) {
        return format(start, "d MMMM yyyy", { locale: fr });
      }
      return `${format(start, "d MMM", { locale: fr })} – ${format(end, "d MMM yyyy", { locale: fr })}`;
    }
    return `${format(start, "d MMM yyyy", { locale: fr })} – ${format(end, "d MMM yyyy", { locale: fr })}`;
  } catch {
    return "";
  }
}

export function EventList({ events }: { events: SpecialEventWithTemplate[] }) {
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [idToDelete, setIdToDelete] = useState<string>("");

  const openCreate = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const openEdit = (event: any) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    const res = await deleteSpecialEvent(id);
    if (res.success) toast.success("Événement supprimé");
    else toast.error("Erreur lors de la suppression");
    setIsLoading(false);
    setIdToDelete("");
  };

  const { activeEvents, pastEvents } = useMemo(() => {
    const active: SpecialEventWithTemplate[] = [];
    const past: SpecialEventWithTemplate[] = [];

    events.forEach((evt) => {
      const status = getEventStatus(evt.startDate, evt.endDate);
      if (status === "PAST") {
        past.push(evt);
      } else {
        active.push(evt);
      }
    });

    // Active : ongoing first, then soonest start date
    active.sort((a, b) => {
      const statusA = getEventStatus(a.startDate, a.endDate);
      const statusB = getEventStatus(b.startDate, b.endDate);
      if (statusA === "ONGOING" && statusB !== "ONGOING") return -1;
      if (statusB === "ONGOING" && statusA !== "ONGOING") return 1;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

    // Past : most recent end date first
    past.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

    return { activeEvents: active, pastEvents: past };
  }, [events]);

  const displayedEvents = activeTab === "active" ? activeEvents : pastEvents;

  return (
    <div className="space-y-6">
      {/* Barre supérieure : Ligne d'options + Bouton de création */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
        {/* Ligne d'options : Actif & Passé */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
              activeTab === "active"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            )}
          >
            <span>Actif</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                activeTab === "active"
                  ? "bg-white/20 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              )}
            >
              {activeEvents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("past")}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
              activeTab === "past"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            )}
          >
            <span>Passé</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                activeTab === "past"
                  ? "bg-white/20 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              )}
            >
              {pastEvents.length}
            </span>
          </button>
        </div>

        {/* Bouton création */}
        <Button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs text-xs font-semibold self-start sm:self-auto"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Créer un événement
        </Button>
      </div>

      {/* Grille des Cards */}
      {displayedEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedEvents.map((evt) => {
            const status = getEventStatus(evt.startDate, evt.endDate);
            const dateRange = formatEventDates(evt.startDate, evt.endDate);
            const templateCount = evt.eventTemplates?.length ?? 0;

            return (
              <div
                key={evt.id}
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-200 p-5 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between group relative"
              >
                <div>
                  {/* Ligne Date & Statut & Menu Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200/70 px-2.5 py-1 rounded-lg">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span className="capitalize">{dateRange}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {status === "ONGOING" && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          En cours
                        </span>
                      )}

                      {status === "UPCOMING" && (
                        <span className="inline-flex items-center text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full shrink-0">
                          À venir
                        </span>
                      )}

                      {status === "PAST" && (
                        <span className="inline-flex items-center text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full shrink-0">
                          Terminé
                        </span>
                      )}

                      {/* Dropdown Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="h-7 w-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl">
                          <DropdownMenuItem onClick={() => openEdit(evt)} className="text-xs cursor-pointer">
                            <Edit className="mr-2 h-3.5 w-3.5" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setIdToDelete(evt.id)}
                            className="text-xs text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Titre & Description */}
                  <div className="mt-3.5 mb-2">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {evt.title}
                    </h3>
                    {evt.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {evt.description}
                      </p>
                    )}
                  </div>

                  {/* Info créneaux templates */}
                  {templateCount > 0 && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-2">
                      <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                      <span>{templateCount} {templateCount > 1 ? "créneaux modèles" : "créneau modèle"}</span>
                    </p>
                  )}
                </div>

                {/* Bouton d'action */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  <Link
                    href={`/dashboard/leader/events/${evt.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/80 hover:border-indigo-200 transition-all"
                  >
                    Gérer le planning
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-300">
            <CalendarDays className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            {activeTab === "active"
              ? "Aucun événement actif pour le moment"
              : "Aucun événement passé"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {activeTab === "active"
              ? "Créez un nouvel événement ou consultez les événements passés."
              : "Les événements terminés apparaîtront dans cet historique."}
          </p>
          {activeTab === "active" && (
            <Button
              onClick={openCreate}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Créer un événement
            </Button>
          )}
        </div>
      )}

      {/* MODAL CRÉATION / ÉDITION */}
      <EventFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventToEdit={editingEvent}
      />

      {/* CONFIRMATION DE SUPPRESSION */}
      <AlertDialog open={idToDelete !== ""} onOpenChange={(open) => !open && setIdToDelete("")}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement cet événement et ses créneaux associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(idToDelete)}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              Confirmer la suppression
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
