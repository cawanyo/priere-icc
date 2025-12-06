"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Clock, ArrowDownAZ, Loader2 } from "lucide-react";
import { createSpecialEvent, updateSpecialEvent } from "@/app/actions/event";
import { toast } from "sonner";
import { SpecialEventWithTemplate } from "@/lib/types";
import { formatUtcDate, normalizeDate } from "@/lib/utils";
import { normalize } from "path";

export type Template = {
  title: string;
  startTime: string;
  endTime: string;
  id?: string 
};

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: SpecialEventWithTemplate | null; // Si présent, on est en mode édition
}

export function EventFormModal({ isOpen, onClose, eventToEdit }: EventFormModalProps) {
  const [loading, setLoading] = useState(false);
  
  // États du formulaire
  const [formData, setFormData] = useState({
    title: "", 
    description: "", 
    startDate: "", 
    endDate: ""
  });

  const [templates, setTemplates] = useState<Template[]>([
    { title: "Session de prière", startTime: "19:00", endTime: "20:30" }
  ]);
  // Initialisation à l'ouverture
  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        // MODE ÉDITION : Pré-remplissage
        setFormData({
            title: eventToEdit.title,
            description: eventToEdit.description || "",
            startDate: formatUtcDate(new Date(eventToEdit.startDate), "yyyy-MM-dd"),
            endDate: formatUtcDate(new Date(eventToEdit.endDate), "yyyy-MM-dd"),
        });

        if (eventToEdit.templates && eventToEdit.templates.length > 0) {
            setTemplates(eventToEdit.templates.map((t) => ({
                title: t.title,
                startTime: t.startTime,
                endTime: t.endTime,
                id: t.id
            })));
        } else {
            setTemplates([{ title: "Session", startTime: "09:00", endTime: "10:00" }]);
        }
      } else {
        // MODE CRÉATION : Reset
        setFormData({ title: "", description: "", startDate: "", endDate: "" });
        setTemplates([{ title: "Session de prière", startTime: "19:00", endTime: "20:30" }]);
      }
    }
  }, [isOpen, eventToEdit]);

  // --- GESTION DES TEMPLATES ---
  const addTemplate = () => setTemplates([...templates, { title: "", startTime: "", endTime: "" }]);
  
  const removeTemplate = (i: number) => {
    if (templates.length > 1) setTemplates(templates.filter((_, idx) => idx !== i));
    else toast.error("Un créneau minimum requis");
  };
  
  const updateTemplate = (i: number, field: keyof Template, val: string) => {
    const newT = [...templates];
    newT[i] = { ...newT[i], [field]: val };
    setTemplates(newT);
  };
  
  const sortTemplates = () => {
    setTemplates([...templates].sort((a, b) => a.startTime.localeCompare(b.startTime)));
    toast.success("Trié !");
  };

  // --- SOUMISSION ---
  const handleSubmit = async () => {
    if (!formData.title || !formData.startDate || !formData.endDate) {
        toast.error("Veuillez remplir les informations générales.");
        return;
    }

    console.log(templates)

    setLoading(true);
    const startDateObj = normalizeDate(formData.startDate);
    startDateObj.setHours(0, 0, 0, 0);

    const endDateObj = normalizeDate(formData.endDate);
    endDateObj.setHours(23, 59, 59, 999);

    let res;
    
    if (eventToEdit) {
        res = await updateSpecialEvent({
            id: eventToEdit.id,
            ...formData,
            templates
        });
    } else {
        res = await createSpecialEvent({
            ...formData,
            templates
        });
        
    }

    setLoading(false);

    if(res.success) {
        toast.success(eventToEdit ? "Événement modifié" : "Événement créé");
        onClose();
    } else {
        toast.error("Erreur : " + res.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
            <DialogHeader className="p-6 pb-2">
                <DialogTitle className="text-xl text-indigo-900">
                    {eventToEdit ? "Modifier l'événement" : "Nouvel Événement"}
                </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {/* Infos Générales */}
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Nom de l'événement</Label>
                        <Input 
                            placeholder="Ex: 21 Jours de Jeûne" 
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})} 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Début</Label>
                            <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Fin</Label>
                            <Input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                        </div>
                    </div>
                </div>

                {/* Créneaux */}
                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                            Créneaux Quotidiens
                        </h4>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={sortTemplates} className="h-8 text-xs">
                                <ArrowDownAZ className="h-3.5 w-3.5 mr-1" /> Trier
                            </Button>
                            <Button variant="ghost" size="sm" onClick={addTemplate} className="text-indigo-600 hover:bg-indigo-50 h-8">
                                <Plus className="h-3 w-3 mr-1" /> Ajouter
                            </Button>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        {templates.map((t, index) => (
                            <div key={index} className="flex flex-col gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50/50 group hover:border-indigo-100 transition-colors">
                                <div className="flex items-center gap-2">
                                    <Input 
                                        placeholder="Nom (ex: Matin)" 
                                        className="h-8 bg-white flex-1" 
                                        value={t.title}
                                        onChange={(e) => updateTemplate(index, "title", e.target.value)}
                                    />
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => removeTemplate(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                        <Input type="time" className="h-8 pl-8 bg-white" value={t.startTime} onChange={(e) => updateTemplate(index, "startTime", e.target.value)} />
                                    </div>
                                    <span className="text-gray-400">-</span>
                                    <div className="relative flex-1">
                                        <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                        <Input type="time" className="h-8 pl-8 bg-white" value={t.endTime} onChange={(e) => updateTemplate(index, "endTime", e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <DialogFooter className="p-6 pt-2 border-t mt-auto">
                <Button variant="outline" onClick={onClose}>Annuler</Button>
                <Button onClick={handleSubmit} disabled={loading} className="bg-indigo-900 hover:bg-indigo-800">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (eventToEdit ? "Enregistrer" : "Créer l'événement")}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}