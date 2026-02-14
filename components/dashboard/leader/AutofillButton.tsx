"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel 
} from "@/components/ui/alert-dialog";
import { Sparkles, Loader2 } from "lucide-react";
import { autoFillPlanning } from "@/app/actions/auto-prayer-house-planning";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  assignmentId: string;
  date: Date;
  disabled?: boolean;
  finallyFunction?: () => void
}

export function AutoFillButton({ assignmentId, date, disabled, finallyFunction }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAutoFill = async () => {
    setLoading(true);
    const res = await autoFillPlanning(assignmentId, date);
    
    if (res.success) {
      toast.success(`Planning complété ! (${res.count} créneaux ajoutés)`);
      router.refresh();
      finallyFunction && finallyFunction(); 
      setOpen(false); // On ferme la modale seulement après succès
    } else {
      toast.error("Erreur : " + res.error);
    }
    setLoading(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          disabled={disabled || loading}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Compléter auto.
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Lancer le remplissage automatique ?</AlertDialogTitle>
          <AlertDialogDescription>
            L'algorithme va parcourir les créneaux vides et assigner les membres disponibles en respectant :
            <span className="list-disc pl-5 mt-2 space-y-1 text-xs text-gray-500">
                <li>Les indisponibilités déclarées.</li>
                <li>La règle de rotation (ne pas refaire la même heure tant que le cycle n'est pas fini).</li>
                <li>L'équilibre de la charge de travail sur la semaine.</li>
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
          
          {/* On utilise un Button standard ici pour gérer le loading manuellement */}
          <Button onClick={handleAutoFill} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Lancer l'algorithme
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}