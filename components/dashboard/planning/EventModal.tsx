"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IntercessorSelector } from "./IntercessorSelector";
import { toast } from "sonner";
import { format } from "date-fns";
import { deletePlanningEvent, savePlanningEvent } from "@/app/actions/planing";

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

interface EventModalProps {
  event: PlaningWithIntercessor | null; // L'événement sélectionné (contient la date complète)
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  date: Date
}

export function EventModal({ event, isOpen, onClose, onRefresh, date}: EventModalProps) {
  const [formData, setFormData] = useState({
    date: format(date, "yyyy-MM-dd"),
    title: "",
    description: "",
    startTime: "", // Stockera "HH:mm"
    endTime: "",   // Stockera "HH:mm"
    intercessorIds: [] as string[]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setFormData({
        date: format(date, "yyyy-MM-dd"),
        title: event.title || "",
        description: event.description || "",
        // On extrait juste l'heure pour l'affichage
        startTime: event.startTime,
        endTime: event.endTime,
        intercessorIds: event.intercessors ? event.intercessors.map((i: any) => i.id) : []
      });
    }
  }, [event]);

  const handleSave = async () => {
    setLoading(true);

    const payload = {
        id: event?.id,
        recurringId: event?.recurringId,
        specialEventId: event?.specialEventId,
        title: formData.title,
        description: formData.description,
        // On fusionne la date originale avec la nouvelle heure
        startTime: formData.startTime,
        endTime: formData.endTime,
        intercessorIds: formData.intercessorIds,
        date: formData.date
    };
    
    const res = await savePlanningEvent(payload);
    setLoading(false);
    
    if (res.success) {
        toast.success("Programme enregistré");
        onRefresh();
        onClose();
    } else {
        toast.error("Erreur d'enregistrement");
    }
  };

  const handleDelete = async () => {
   
    if(!event) return ;

    setLoading(true);
    await deletePlanningEvent(event.id);
    setLoading(false);
    toast.success("Supprimé");
    onRefresh();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{"Modifier le créneau"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
            <div className="grid gap-2">
                <Label>Titre</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="grid gap-2">
                <Label>Date</Label>
                <Input value={formData.date}  type={"date"} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>Heure de début</Label>
                    <Input 
                        type="time" // Input simple HH:mm
                        value={formData.startTime} 
                        onChange={e => setFormData({...formData, startTime: e.target.value})} 
                    />
                </div>
                <div className="grid gap-2">
                    <Label>Heure de fin</Label>
                    <Input 
                        type="time" 
                        value={formData.endTime} 
                        onChange={e => setFormData({...formData, endTime: e.target.value})} 
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Assigner des intercesseurs</Label>
                <IntercessorSelector 
                    selectedIds={formData.intercessorIds}
                    onChange={(ids) => setFormData({...formData, intercessorIds: ids})}
                />
            </div>

            <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
            {event  && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={loading}>
                            Supprimer
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action est irréversible. Cela supprimera définitivement cet événement du planning.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                                Confirmer la suppression
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Annuler</Button>
                <Button onClick={handleSave} disabled={loading}>Enregistrer</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}