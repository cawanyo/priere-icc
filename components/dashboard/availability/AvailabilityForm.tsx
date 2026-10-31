"use client";

import { useState } from "react";
import { addUnavailability } from "@/app/actions/availability";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CalendarPlus, CalendarRange } from "lucide-react";
import { DateRange } from "react-day-picker";
import { fr } from "date-fns/locale";
import { format, isSameDay } from "date-fns";
import { useRouter } from "next/navigation";

export function AvailabilityForm() {
  const router = useRouter();
  const [date, setDate] = useState<DateRange | undefined>();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date?.from) {
      toast.error("Veuillez sélectionner au moins une date sur le calendrier.");
      return;
    }

    setLoading(true);
    try {
      const res = await addUnavailability({
        dateRange: {
          from: format(date.from, "yyyy-MM-dd"),
          to: date.to ? format(date.to, "yyyy-MM-dd") : undefined,
        },
        reason: reason.trim() || undefined,
      });

      if (res.success) {
        toast.success(res.message);
        setReason("");
        setDate(undefined);
        router.refresh();
      } else {
        toast.error(res.message || "Erreur lors de l'enregistrement.");
      }
    } catch {
      toast.error("Une erreur imprévue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
      {/* En-tête formulaire */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
          <CalendarPlus className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">Déclarer une absence</h2>
          <p className="text-[11px] text-slate-400">
            Sélectionnez la période où vous ne serez pas disponible.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Calendrier de sélection */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <CalendarRange className="h-3.5 w-3.5 text-slate-500" />
            Période d&apos;absence
          </Label>

          <div className="border border-slate-200/80 rounded-2xl p-2.5 flex justify-center bg-slate-50/40">
            <Calendar
              mode="range"
              selected={date}
              onSelect={setDate}
              locale={fr}
              numberOfMonths={1}
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-xl"
            />
          </div>

          {/* Récapitulatif visuel sobre de la sélection */}
          {date?.from ? (
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs flex items-center justify-between">
              <span className="text-indigo-900 font-medium capitalize">
                {date.to && !isSameDay(date.from, date.to) ? (
                  <>
                    Du <strong>{format(date.from, "d MMMM", { locale: fr })}</strong> au{" "}
                    <strong>{format(date.to, "d MMMM yyyy", { locale: fr })}</strong>
                  </>
                ) : (
                  <>
                    Le <strong>{format(date.from, "EEEE d MMMM yyyy", { locale: fr })}</strong>
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={() => setDate(undefined)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline ml-2 shrink-0"
              >
                Effacer
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 text-center">
              Cliquez sur une date de début puis de fin (ou un seul jour).
            </p>
          )}
        </div>

        {/* Motif / Commentaire */}
        <div className="space-y-1.5">
          <Label htmlFor="reason" className="text-xs font-semibold text-slate-700">
            Motif ou commentaire <span className="text-slate-400 font-normal">(optionnel)</span>
          </Label>
          <Input
            id="reason"
            placeholder="Ex: Vacances, Déplacement professionnel, Santé..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-10 text-xs rounded-xl border-slate-200 bg-white placeholder:text-slate-400"
          />
        </div>

        {/* Bouton d'enregistrement */}
        <Button
          type="submit"
          className="w-full bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl h-10 font-semibold text-xs sm:text-sm shadow-xs cursor-pointer"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CalendarPlus className="mr-1.5 h-4 w-4" />
          )}
          Enregistrer mon indisponibilité
        </Button>
      </form>
    </div>
  );
}
