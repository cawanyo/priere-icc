"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, ArrowRight, Trash2, Clock, MoreVertical, Edit, ArrowDownAZ, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSpecialEvent, updateSpecialEvent, deleteSpecialEvent } from "@/app/actions/event"; // Nouveaux imports
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

type Template = {
  title: string;
  startTime: string;
  endTime: string;
};

export function EventList({ events }: { events: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // ID si mode édition
  
  const [formData, setFormData] = useState({
    title: "", 
    description: "", 
    startDate: "", 
    endDate: ""
  });

  const [templates, setTemplates] = useState<Template[]>([
    { title: "Session de prière", startTime: "19:00", endTime: "20:30" }
  ]);

  // --- GESTION DU FORMULAIRE ---

  const resetForm = () => {
    setFormData({ title: "", description: "", startDate: "", endDate: "" });
    setTemplates([{ title: "Session de prière", startTime: "19:00", endTime: "20:30" }]);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (event: any) => {
    // Pré-remplissage
    setEditingId(event.id);
    setFormData({
        title: event.title,
        description: event.description || "",
        startDate: format(new Date(event.startDate), "yyyy-MM-dd"),
        endDate: format(new Date(event.endDate), "yyyy-MM-dd"),
    });


    if (event.templates) {
        setTemplates(event.templates.map((t: any) => ({
            title: t.title,
            startTime: format(new Date(t.startTime), "HH:mm"),
            endTime: format(new Date(t.endTime), "HH:mm"),
        })));
    } else {
        // Fallback si pas chargé
        setTemplates([{ title: "Session", startTime: "09:00", endTime: "10:00" }]); 
    }

    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.startDate || !formData.endDate) {
        toast.error("Veuillez remplir les informations générales.");
        return;
    }

    setLoading(true);
    let res;
    
    if (editingId) {
        // MODE UPDATE
        res = await updateSpecialEvent({
            id: editingId,
            ...formData,
            templates
        });
    } else {
        // MODE CREATE
        res = await createSpecialEvent({
            ...formData,
            templates
        });
    }

    setLoading(false);

    if(res.success) {
        toast.success(editingId ? "Événement modifié" : "Événement créé");
        setIsModalOpen(false);
        resetForm();
    } else {
        toast.error("Erreur : " );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet événement et tout son planning ?")) return;
    const res = await deleteSpecialEvent(id);
    if (res.success) toast.success("Supprimé");
    else toast.error("Erreur suppression");
  };

  // --- GESTION TEMPLATES ---
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

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-indigo-900">Vos Événements</h3>
            <Button onClick={openCreate} className="bg-pink-600 hover:bg-pink-700">
                <Plus className="mr-2 h-4 w-4"/> Créer un événement
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(evt => (
                <Card key={evt.id} className="group hover:shadow-md transition-all duration-300 border-gray-100 flex flex-col relative">
                    
                    {/* Menu Actions */}
                    <div className="absolute top-3 right-3 z-10">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/80 backdrop-blur hover:bg-white text-gray-500">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(evt)}>
                                    <Edit className="mr-2 h-4 w-4" /> Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(evt.id)} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start pr-8">
                            <CardTitle className="text-lg font-serif text-indigo-900 line-clamp-1">{evt.title}</CardTitle>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col">
                        <div className="text-sm text-gray-500 flex items-center mb-4 bg-gray-50 p-2 rounded-md w-fit">
                            <Calendar className="h-4 w-4 mr-2 text-pink-500" />
                            <span className="font-medium">
                                {format(new Date(evt.startDate), "d MMM", {locale:fr})}
                            </span>
                            <span className="mx-1.5">-</span>
                            <span className="font-medium">
                                {format(new Date(evt.endDate), "d MMM yyyy", {locale:fr})}
                            </span>
                        </div>
                        
                        <div className="mt-auto pt-4">
                            <Button asChild variant="outline" className="w-full group-hover:border-indigo-200 group-hover:text-indigo-700 transition-colors">
                                <Link href={`/dashboard/leader/events/${evt.id}`}>
                                    Gérer le planning <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>

        {/* MODALE CREATE / EDIT */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl text-indigo-900">
                        {editingId ? "Modifier l'événement" : "Nouvel Événement"}
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
                                <div key={index} className="flex flex-col gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
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
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-indigo-900 hover:bg-indigo-800">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : (editingId ? "Enregistrer" : "Créer l'événement")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}