"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IntercessorSelector } from "./IntercessorSelector";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { deletePlanningEvent, savePlanningEvent } from "@/app/actions/planing";
import { Clock, Calendar, Trash2, Users, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PlaningWithIntercessor } from "@/lib/types";
import { convertKeepDate } from "@/lib/utils";

interface EventModalProps {
  event: PlaningWithIntercessor | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  date: Date;
  specialEventId?: string;
}

export function EventModal({
  event,
  isOpen,
  onClose,
  onRefresh,
  date,
  specialEventId,
}: EventModalProps) {
  const [formData, setFormData] = useState({
    date: format(date, "yyyy-MM-dd"),
    title: "",
    description: "",
    startTime: "19:00",
    endTime: "20:00",
    intercessorIds: [] as string[],
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (event) {
        setFormData({
          title: event.title || "",
          description: event.description || "",
          startTime: event.startTime || "19:00",
          endTime: event.endTime || "20:00",
          date: format(convertKeepDate(event?.date), "yyyy-MM-dd"),
          intercessorIds: event.users?.map((u: any) => u.id) || [],
        });
      } else {
        setFormData({
          title: "",
          description: "",
          startTime: "19:00",
          endTime: "20:00",
          date: format(date, "yyyy-MM-dd"),
          intercessorIds: [],
        });
      }
    }
  }, [isOpen, event, date]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Veuillez renseigner un titre pour le créneau.");
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      toast.error("Veuillez renseigner les heures de début et de fin.");
      return;
    }

    setLoading(true);

    const payload = {
      id: event?.id,
      recurringId: event?.recurringId,
      specialEventId: event?.specialEventId || specialEventId,
      title: formData.title.trim(),
      description: formData.description.trim(),
      startTime: formData.startTime,
      endTime: formData.endTime,
      intercessorIds: formData.intercessorIds,
      date: formData.date,
    };

    const res = await savePlanningEvent(payload);
    setLoading(false);

    if (res.success) {
      toast.success(event ? "Créneau mis à jour" : "Créneau ajouté avec succès");
      onRefresh();
      onClose();
    } else {
      toast.error("Erreur lors de l'enregistrement du créneau");
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    setLoading(true);
    await deletePlanningEvent(event.id);
    setLoading(false);
    toast.success("Créneau supprimé");
    onRefresh();
    onClose();
  };

  const displayDateStr = (() => {
    try {
      const parts = formData.date.split("-").map(Number);
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return format(d, "EEEE d MMMM yyyy", { locale: fr });
      }
      return format(date, "EEEE d MMMM yyyy", { locale: fr });
    } catch {
      return "";
    }
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl sm:rounded-3xl border-slate-200/90 shadow-2xl">
        {/* Entête épuré et sobre */}
        <div className="p-5 sm:p-6 pb-4 bg-slate-50/80 border-b border-slate-100 flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {event ? "Modifier le créneau" : "Nouveau créneau"}
            </DialogTitle>
            <p className="text-xs text-slate-500 capitalize mt-0.5">
              {displayDateStr}
            </p>
          </div>
        </div>

        {/* Corps du formulaire bien structuré */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Titre */}
          <div className="space-y-1.5">
            <Label htmlFor="slot-title" className="text-xs font-semibold text-slate-700">
              Intitulé du créneau <span className="text-red-500">*</span>
            </Label>
            <Input
              id="slot-title"
              placeholder="Ex: Intercession matinale, Tour de prière..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-sm rounded-xl bg-white"
            />
          </div>

          {/* Horaires et Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="start-time" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Heure de début
              </Label>
              <Input
                id="start-time"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="text-sm font-mono rounded-xl bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-time" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Heure de fin
              </Label>
              <Input
                id="end-time"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="text-sm font-mono rounded-xl bg-white"
              />
            </div>
          </div>

          {/* Date si besoin de modifier le jour */}
          <div className="space-y-1.5">
            <Label htmlFor="slot-date" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Date du service
            </Label>
            <Input
              id="slot-date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="text-sm rounded-xl bg-white"
            />
          </div>

          {/* Conducteurs et Intercesseurs assignés */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                Conducteurs & intercesseurs assignés
              </Label>
              <span className="text-[11px] font-medium text-slate-500">
                {formData.intercessorIds.length} assigné{formData.intercessorIds.length > 1 ? "s" : ""}
              </span>
            </div>
            <IntercessorSelector
              selectedIds={formData.intercessorIds}
              onChange={(ids) => setFormData({ ...formData, intercessorIds: ids })}
            />
          </div>

          {/* Description optionnelle */}
          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <Label htmlFor="slot-desc" className="text-xs font-semibold text-slate-700">
              Consignes ou description <span className="text-slate-400 font-normal">(optionnel)</span>
            </Label>
            <Textarea
              id="slot-desc"
              placeholder="Points de prière spécifiques, instructions pour l'équipe..."
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="text-sm rounded-xl bg-white resize-none"
            />
          </div>
        </div>

        {/* Pied de dialogue sobre */}
        <div className="p-4 sm:px-6 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            {event && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={loading}
                    className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl h-9 px-3 cursor-pointer gap-1.5 font-medium"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer ce créneau ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action retirera ce créneau du planning. Les membres inscrits ne seront plus affectés.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
                    >
                      Confirmer la suppression
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs rounded-xl h-9 px-3.5 cursor-pointer"
            >
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl h-9 px-4 cursor-pointer shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
