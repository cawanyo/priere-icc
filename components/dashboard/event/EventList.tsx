"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, ArrowRight, Trash2, MoreVertical, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteSpecialEvent } from "@/app/actions/event";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale"; // J'ai ajouté la locale FR pour un affichage propre (ex: "25 Oct")
import Link from "next/link";
import { EventFormModal } from "./EventFormModal";
import { SpecialEventWithTemplate } from "@/lib/types";
import { convertKeepDate, formatUtcDate } from "@/lib/utils";

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
export function EventList({ events }: { events: SpecialEventWithTemplate[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [idToDelete, setIdToDelete] = useState<string>("")
  const openCreate = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const openEdit = (event: any) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true)
    const res = await deleteSpecialEvent(id);
    if (res.success) toast.success("Supprimé");
    else toast.error("Erreur suppression");
    setIsLoading(false)
  };

  /**
   * Helper pour formater une date UTC en ignorant le fuseau horaire local du navigateur.
   * On reconstruit une date locale avec les composants UTC (Jour, Mois, Année) exacts.
   */

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
                                <DropdownMenuItem onClick={() => setIdToDelete(evt.id)} className="text-red-600 focus:text-red-700 focus:bg-red-50">
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
                            <span className="font-medium capitalize">
                                {/* Utilisation de la fonction helper ici */}
                                {format(convertKeepDate(evt.startDate), "d MMM")}
                            </span>
                            <span className="mx-1.5">-</span>
                            <span className="font-medium capitalize">
                                {format(convertKeepDate(evt.endDate), "d MMM yyyy")}
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
            {events.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                    Aucun événement spécial pour le moment.
                </div>
            )}
        </div>

        {/* COMPOSANT MODAL */}
        <EventFormModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            eventToEdit={editingEvent}
        />

            <AlertDialog open={idToDelete!=""} onOpenChange={(open) => !open && setIdToDelete("")}>

                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Cela supprimera définitivement cet événement du planning.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(idToDelete)} className="bg-red-600 hover:bg-red-700 text-white">
                            Confirmer la suppression
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
    </div>
  );
}