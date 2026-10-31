"use client";

import { format, isSameDay, differenceInCalendarDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, CalendarCheck, CalendarRange, Loader2, Clock } from "lucide-react";
import { deleteUnavailability } from "@/app/actions/availability";
import { toast } from "sonner";
import { useState } from "react";
import { normalizeDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { REALTIME_CHANNELS } from "@/lib/realtime-channels";

interface AvailabilityListProps {
  items: any[];
  leaderMode?: boolean;
}

export function AvailabilityList({ items, leaderMode }: AvailabilityListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await deleteUnavailability(id);
      if (res.success) {
        toast.success(res.message || "Indisponibilité retirée.");
        router.refresh();
      } else {
        toast.error(res.message || "Erreur lors du retrait.");
      }
    } catch {
      toast.error("Erreur lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  };

  // Synchronisation temps réel automatique
  useRealtimeSync({
    channel: REALTIME_CHANNELS.AVAILABILITY,
    onUpdate: () => {
      router.refresh();
    },
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
      {/* En-tête de liste */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0">
            <CalendarRange className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              {leaderMode ? "Absences de l'équipe" : "Mes absences à venir"}
            </h2>
            <p className="text-[11px] text-slate-400">
              {leaderMode
                ? "Membres indisponibles sur les prochaines dates."
                : "Périodes durant lesquelles vous ne serez pas affecté(e)."}
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
          {items.length} {items.length > 1 ? "absences" : "absence"}
        </span>
      </div>

      {/* Contenu */}
      {items.length === 0 ? (
        <div className="py-10 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800">Aucune absence enregistrée</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {leaderMode
                ? "Tous les membres de l'équipe sont considérés comme disponibles."
                : "Vous êtes actuellement considéré(e) comme disponible pour le planning de prière."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => {
            const startDate = normalizeDate(item.startDate);
            const endDate = normalizeDate(item.endDate);
            const isRange = !isSameDay(startDate, endDate);
            const daysCount = Math.max(1, differenceInCalendarDays(endDate, startDate) + 1);
            const isDeleting = deletingId === item.id;

            // Synchronisation temps réel automatique
  useRealtimeSync({
    channel: REALTIME_CHANNELS.AVAILABILITY,
    onUpdate: () => {
      router.refresh();
    },
  });

  return (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0">
                  {/* Mode Leader : affichage de l'intercesseur */}
                  {leaderMode && item.user && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <Avatar className="h-5 w-5 ring-1 ring-white">
                        <AvatarImage src={item.user.image} />
                        <AvatarFallback className="text-[9px] bg-indigo-100 text-indigo-700 font-bold">
                          {item.user.name?.slice(0, 1) || "M"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-bold text-slate-900">
                        {item.user.name || "Membre"}
                      </span>
                    </div>
                  )}

                  {/* Date formatée propre */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 capitalize">
                      <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                      {isRange ? (
                        <>
                          Du {format(startDate, "d MMM", { locale: fr })} au{" "}
                          {format(endDate, "d MMM yyyy", { locale: fr })}
                        </>
                      ) : (
                        <>Le {format(startDate, "EEEE d MMMM yyyy", { locale: fr })}</>
                      )}
                    </span>

                    <span className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md shrink-0">
                      {daysCount} {daysCount > 1 ? "jours" : "jour"}
                    </span>
                  </div>

                  {/* Motif */}
                  {item.reason && item.reason !== "Indisponible" && (
                    <p className="text-xs text-slate-500 line-clamp-1 italic">
                      « {item.reason} »
                    </p>
                  )}
                </div>

                {/* Bouton de suppression pour l'utilisateur */}
                {!leaderMode && (
                  <div className="self-end sm:self-center shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isDeleting}
                      onClick={() => handleDelete(item.id)}
                      className="h-8 px-2.5 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Supprimer cette indisponibilité"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sm:hidden text-[11px]">Supprimer</span>
                        </span>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
