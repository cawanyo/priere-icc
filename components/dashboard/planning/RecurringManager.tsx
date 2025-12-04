"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CustomSelect } from "@/components/ui/custom-select"; 
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Repeat, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createRecurringSchedule, deleteRecurringSchedule, getRecurringSchedules } from "@/app/actions/planing";


interface RecurringManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const DAYS = [
  { value: "1", label: "Lundi" },
  { value: "2", label: "Mardi" },
  { value: "3", label: "Mercredi" },
  { value: "4", label: "Jeudi" },
  { value: "5", label: "Vendredi" },
  { value: "6", label: "Samedi" },
  { value: "0", label: "Dimanche" },
];

// Schéma de validation Zod
const recurringSchema = z.object({
  title: z.string().min(2, "Le titre est requis"),
  dayOfWeek: z.string( "Veuillez choisir un jour" ),
  startTime: z.string().min(1, "Heure de début requise"),
  endTime: z.string().min(1, "Heure de fin requise"),
});

type RecurringFormValues = z.infer<typeof recurringSchema>;

export function RecurringManager({ isOpen, onClose, onRefresh }: RecurringManagerProps) {
  const [schedules, setSchedules] = useState<any[]>([]);
  
  // Initialisation du formulaire RHF
  const form = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      title: "",
      dayOfWeek: "",
      startTime: "",
      endTime: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const loadSchedules = async () => {
    const res = await getRecurringSchedules();
    if (res.success) setSchedules(res.data?? []);
  };

  useEffect(() => {
    if (isOpen) loadSchedules();
  }, [isOpen]);

  const onSubmit = async (values: RecurringFormValues) => {
    const res = await createRecurringSchedule(values);

    if (res.success) {
      toast.success("Programme récurrent ajouté");
      form.reset(); // Réinitialiser le formulaire
      loadSchedules(); // Recharger la liste
      onRefresh(); // Rafraîchir le calendrier derrière
    } else {
      toast.error("Erreur lors de la création");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Supprimer ce modèle ? Les événements futurs générés disparaîtront.")) return;
    
    const res = await deleteRecurringSchedule(id);
    if(res.success) {
        toast.success("Supprimé");
        loadSchedules();
        onRefresh();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-900">
            <Repeat className="h-5 w-5" /> Programmes Récurrents
          </DialogTitle>
          <DialogDescription>
            Définissez les événements qui se répètent chaque semaine.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
            
            {/* FORMULAIRE D'AJOUT AVEC RHF */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Nouveau modèle</h4>
                
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Titre</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Intercession Matinale" {...field} className="bg-white" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="dayOfWeek"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Jour</FormLabel>
                                        {/* CustomSelect fonctionne maintenant car il est dans un FormItem */}
                                        <CustomSelect 
                                            options={DAYS}
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Choisir un jour"
                                            className="bg-white"
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Heure début</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} className="bg-white" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="endTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Heure fin</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} className="bg-white" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button type="submit" disabled={isLoading} className="w-full bg-indigo-900 hover:bg-indigo-800">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Plus className="mr-2 h-4 w-4"/>}
                            Ajouter au planning hebdo
                        </Button>
                    </form>
                </Form>
            </div>

            {/* LISTE DES MODÈLES EXISTANTS */}
            <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Modèles actifs ({schedules.length})</h4>
                <div className="space-y-2">
                    {schedules.length === 0 && (
                        <p className="text-sm text-gray-400 italic text-center py-4">Aucun programme récurrent.</p>
                    )}
                    {schedules.map((item) => {
                        // Formattage de l'heure
                        
                        const dayLabel = DAYS.find(d => d.value === item.dayOfWeek.toString())?.label || "Jour inconnu";

                        return (
                            <Card key={item.id} className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-semibold text-gray-900">{item.title}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">
                                            {dayLabel}
                                        </span>
                                        <span>{item.startTime} - {item.endTime}</span>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleDelete(item.id)}
                                    className="text-gray-400 hover:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </Card>
                        )
                    })}
                </div>
            </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}