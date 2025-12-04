"use client";

import { useState } from "react";
import { TestimonyCard } from "@/components/testimonies/TestimonyCard";
import { Button } from "@/components/ui/button";
import { Check, X, Trash2, Loader2, Filter } from "lucide-react";
import { updateTestimonyStatus, deleteTestimony } from "@/app/actions/testimony";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

interface TestimonyAdminListProps {
  testimonies: any[];
}

export function TestimonyAdminList({ testimonies }: TestimonyAdminListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleStatusChange = async (id: string, status: string) => {
    setLoadingId(id);
    const res = await updateTestimonyStatus(id, status);
    setLoadingId(null);
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
  };

  const handleDelete = async (id: string) => {
    setLoadingId(id);
    const res = await deleteTestimony(id);
    setLoadingId(null);
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
  };

  const handleFilterChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val === "ALL") params.delete("status");
    else params.set("status", val);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Filtre */}
      <div className="flex justify-end">
        <div className="w-[200px]">
            <Select 
                defaultValue={searchParams.get("status") || "ALL"} 
                onValueChange={handleFilterChange}
            >
                <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2 text-gray-500" />
                    <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">Tous</SelectItem>
                    <SelectItem value="PENDING">En attente</SelectItem>
                    <SelectItem value="APPROVED">Publiés</SelectItem>
                    <SelectItem value="REJECTED">Rejetés</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      {testimonies.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50">
            <p className="text-gray-500">Aucun témoignage trouvé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonies.map((t) => (
            <div key={t.id} className="flex flex-col gap-2">
                {/* La Carte (Affichage) */}
                <div className="flex-1">
                    <TestimonyCard testimony={t} showStatus />
                </div>

                {/* Barre d'actions */}
                <div className="bg-white p-2 rounded-lg border shadow-sm flex items-center justify-between gap-2">
                    
                    {/* Valider / Rejeter */}
                    <div className="flex gap-2">
                        {t.status !== "APPROVED" && (
                            <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 h-8 px-2"
                                onClick={() => handleStatusChange(t.id, "APPROVED")}
                                disabled={!!loadingId}
                            >
                                {loadingId === t.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Check className="h-3 w-3 mr-1" />}
                                Valider
                            </Button>
                        )}
                        {t.status !== "REJECTED" && (
                            <Button 
                                size="sm" 
                                variant="outline"
                                className="text-amber-600 border-amber-200 hover:bg-amber-50 h-8 px-2"
                                onClick={() => handleStatusChange(t.id, "REJECTED")}
                                disabled={!!loadingId}
                            >
                                <X className="h-3 w-3 mr-1" /> Rejeter
                            </Button>
                        )}
                    </div>

                    {/* Supprimer (Avec confirmation) */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer ce témoignage ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Cette action est irréversible. Le contenu et les médias associés seront supprimés.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={() => handleDelete(t.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Supprimer
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
            ))}
        </div>
      )}
    </div>
  );
}