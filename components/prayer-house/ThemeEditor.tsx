"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, MessageSquareQuote, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ThemeEditorProps {
  initialValue?: string | null;
  onSave: (val: string) => Promise<any>;
  placeholder?: string;
  type?: "week" | "day";
}

export function ThemeEditor({
  initialValue,
  onSave,
  placeholder,
  type = "day",
}: ThemeEditorProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialValue || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setValue(initialValue || "");
  }, [initialValue]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(value.trim());
      setOpen(false);
      toast.success(
        type === "week"
          ? "Thème de la semaine enregistré"
          : "Thème du jour enregistré"
      );
    } catch {
      toast.error("Erreur lors de l'enregistrement du thème");
    } finally {
      setLoading(false);
    }
  };

  const isWeek = type === "week";

  return (
    <>
      {/* Bouton déclencheur propre et sobre */}
      {isWeek ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full text-left bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-100/80 rounded-2xl p-3 sm:p-3.5 transition-all group flex items-start gap-3 cursor-pointer shadow-2xs hover:shadow-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-100/80 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
            <MessageSquareQuote className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                Thème de la semaine
              </span>
              <span className="text-xs text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-semibold">
                <Pencil className="h-3 w-3" />
                Modifier
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-indigo-950 mt-1 leading-relaxed break-words whitespace-pre-wrap">
              {initialValue ? (
                initialValue
              ) : (
                <span className="text-indigo-400 font-normal italic">
                  Cliquez pour définir le thème d&apos;intercession de la semaine...
                </span>
              )}
            </p>
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex items-start gap-1.5 text-[11px] py-1 px-2 rounded-lg transition-all cursor-pointer text-left w-full group",
            initialValue
              ? "bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200/60 font-medium"
              : "text-slate-400 hover:text-slate-700 hover:bg-slate-100/70 border border-dashed border-slate-200 justify-center"
          )}
          title="Modifier le thème du jour"
        >
          <MessageSquareQuote className="h-3 w-3 shrink-0 text-indigo-500 mt-0.5" />
          <span className="break-words whitespace-pre-wrap leading-snug flex-1">
            {initialValue ? initialValue : "Ajouter thème"}
          </span>
          <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 shrink-0 text-slate-400 mt-0.5" />
        </button>
      )}

      {/* Modale de modification stylée, spacieuse et propre */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="sm:max-w-lg p-0 overflow-hidden rounded-2xl sm:rounded-3xl border-slate-200 shadow-2xl"
        >
          {/* Entête élégant */}
          <div className="p-5 pb-4 bg-slate-50/80 border-b border-slate-100 flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
              <MessageSquareQuote className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-bold text-slate-900">
                {isWeek ? "Thème de prière de la semaine" : "Thème de prière du jour"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Définissez l&apos;orientation et le sujet d&apos;intercession pour guider les sentinelles.
              </DialogDescription>
            </div>
          </div>

          {/* Corps de formulaire spacieux */}
          <div className="p-5 space-y-3">
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={
                placeholder ||
                (isWeek
                  ? "Ex: La Puissance du Sang de Jésus, Proclamation du Règne de Dieu..."
                  : "Ex: Intercession pour les familles, Guérison et Restauration...")
              }
              rows={4}
              autoFocus={false}
              className="w-full text-sm rounded-xl border-slate-200 bg-white placeholder:text-slate-400 focus-visible:ring-indigo-500 resize-none"
            />
            <p className="text-[11px] text-slate-400">
              Ce thème sera visible par toutes les sentinelles sur leur tableau de garde nocturne.
            </p>
          </div>

          {/* Pied de dialogue sobre */}
          <div className="p-3.5 sm:px-5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="h-9 px-4 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="h-9 px-4 text-xs font-semibold rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white shadow-xs cursor-pointer"
            >
              {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Enregistrer le thème
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
