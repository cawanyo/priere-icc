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

interface EventModalProps {
  event: any | null; // L'événement sélectionné (contient la date complète)
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function EventModal({ event, isOpen, onClose, onRefresh }: EventModalProps) {
  const [formData, setFormData] = useState({
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
        title: event.title || "",
        description: event.description || "",
        // On extrait juste l'heure pour l'affichage
        startTime: format(new Date(event.startTime), "HH:mm"),
        endTime: format(new Date(event.endTime), "HH:mm"),
        intercessorIds: event.intercessors ? event.intercessors.map((i: any) => i.id) : []
      });
    }
  }, [event]);

  const handleSave = async () => {
    setLoading(true);

    // Fonction utilitaire pour remettre l'heure dans la date d'origine
    const mergeDateAndTime = (baseDate: Date, timeStr: string) => {
        const date = new Date(baseDate);
        const [hours, minutes] = timeStr.split(':').map(Number);
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    const payload = {
        id: event.id,
        recurringId: event.recurringId,
        specialEventId: event.specialEventId,
        title: formData.title,
        description: formData.description,
        // On fusionne la date originale avec la nouvelle heure
        startTime: mergeDateAndTime(new Date(event.startTime), formData.startTime),
        endTime: mergeDateAndTime(new Date(event.endTime), formData.endTime),
        intercessorIds: formData.intercessorIds
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
    if(!event.id || event.id.startsWith("virtual-")) return; 
    if(!confirm("Supprimer cet événement ?")) return;

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
          <DialogTitle>{event?.isVirtual ? "Créer le créneau" : "Modifier le créneau"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
            <div className="grid gap-2">
                <Label>Titre</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
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
            {event && !event.isVirtual && (
                <Button variant="destructive" onClick={handleDelete} disabled={loading}>Supprimer</Button>
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