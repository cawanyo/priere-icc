"use client";

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
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ConfirmDeleteProps {
  onConfirm: () => Promise<any>; // La Server Action
  title?: string;
  description?: string;
  trigger?: React.ReactNode; // Si on veut un bouton personnalisé
  variant?: "icon" | "button"; // Style par défaut
  className?: string;
}

export function ConfirmDelete({
  onConfirm,
  title = "Êtes-vous absolument sûr ?",
  description = "Cette action est irréversible. Cela supprimera définitivement cet élément de nos serveurs.",
  trigger,
  variant = "icon",
  className,
}: ConfirmDeleteProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Empêche la fermeture immédiate
    setIsDeleting(true);

    try {
      await onConfirm();
      toast.success("Suppression effectuée");
      setOpen(false); // On ferme la modale seulement si succès
    } catch (error) {
      toast.error("Une erreur est survenue lors de la suppression");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger ? (
          trigger
        ) : variant === "icon" ? (
          <Button
            variant="ghost"
            size="icon"
            className={`text-gray-400 hover:text-red-600 hover:bg-red-50 ${className}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="destructive" className={className}>
            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
          </Button>
        )}
      </AlertDialogTrigger>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Suppression...
              </>
            ) : (
              "Confirmer la suppression"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}