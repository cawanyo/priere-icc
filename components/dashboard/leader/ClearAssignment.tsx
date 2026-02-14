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
import { Eraser, Loader2, Trash2 } from "lucide-react";
import { clearPlanningSlots } from "@/app/actions/auto-prayer-house-planning";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  assignmentId: string;
  finallyFunction? : () => void;
}

export function ClearPlanningButton({ assignmentId, finallyFunction }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClear = async () => {
    setLoading(true);
    const res = await clearPlanningSlots(assignmentId);
    
    if (res.success) {
      toast.success("Planning vidé avec succès");
      finallyFunction && finallyFunction(); 
      router.refresh();
      setOpen(false);
    } else {
      toast.error("Erreur : " + res.error);
    }
    setLoading(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
            variant="ghost" 
            className="text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100"
            title="Tout effacer pour recommencer"
        >
            <Eraser className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Vider</span>
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Vider le planning ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer <strong>tous les créneaux</strong> de cette semaine ?
            <br />
            Cette action est irréversible. La famille restera assignée, mais le tableau sera vierge.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
          
          <Button 
            onClick={handleClear} 
            disabled={loading} 
            variant="destructive" // Style rouge natif de shadcn
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Oui, tout effacer"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}