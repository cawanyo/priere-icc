"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";
import { createPrayerFamily, deletePrayerFamily } from "@/app/actions/prayer-house";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmDelete } from "../DeleteConfirm";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { REALTIME_CHANNELS } from "@/lib/realtime-channels";

export function FamilyList({ initialFamilies }: { initialFamilies: any[] }) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [loading, setLoading] = useState(false);

  // Synchronisation temps réel automatique
  useRealtimeSync({
    channel: REALTIME_CHANNELS.PRAYER_HOUSE,
    onUpdate: () => {
      router.refresh();
    },
  });

  const handleCreate = async () => {
    if (!newFamilyName) return;
    setLoading(true);
    const res = await createPrayerFamily({ name: newFamilyName });
    setLoading(false);
    
    if (res.success) {
      toast.success("Maison créée avec succès");
      setIsCreateOpen(false);
      setNewFamilyName("");
      window.location.reload(); 
    } else {
      toast.error("Erreur lors de la création");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deletePrayerFamily(id);
    if (res.success) window.location.reload();
  };

  return (
    <div className="space-y-3.5">
      {/* Bouton Création compact */}
      <div className="flex justify-end">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 px-3 text-xs font-semibold rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white cursor-pointer shadow-xs">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Nouvelle Maison
            </Button>
          </DialogTrigger>
          <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-slate-900">
                Créer une Maison de Prière
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold text-slate-700">Nom de la maison</Label>
                <Input 
                  placeholder="Ex: Maison Éphraïm" 
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  autoFocus={false}
                  className="h-9 text-xs rounded-xl border-slate-200"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={loading} className="bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl h-8 px-3 text-xs font-semibold cursor-pointer">
                {loading ? "Création..." : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grille des Maisons compacte et sobre */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {initialFamilies.map((family) => {
          const userCount = family._count?.users ?? family.users?.length ?? 0;

          return (
            <div
              key={family.id}
              className="group bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              {/* Entête de carte compact */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs"
                    style={{ backgroundColor: family.color || "#4f46e5" }}
                  >
                    {family.name?.[0] || "M"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                      {family.name}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {userCount} sentinelle{userCount > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <ConfirmDelete
                  title="Supprimer la maison"
                  description="Êtes-vous sûr de vouloir supprimer cette maison ? Cette action est irréversible."
                  onConfirm={() => handleDelete(family.id)}
                />
              </div>

              {/* Pied de carte avec aperçu sentinelles et lien Gérer */}
              <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100">
                <div className="flex -space-x-1.5 overflow-hidden">
                  {(family.users || []).slice(0, 4).map((m: any, i: number) => (
                    <Avatar key={i} className="inline-block h-5 w-5 rounded-full ring-2 ring-white">
                      <AvatarImage src={m.image} />
                      <AvatarFallback className="text-[8px] bg-indigo-50 text-indigo-700 font-bold">
                        {m.name?.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {userCount > 4 && (
                    <div className="h-5 w-5 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[8px] font-semibold text-slate-500">
                      +{userCount - 4}
                    </div>
                  )}
                </div>

                <Link
                  href={`/dashboard/leader/prayer-house/${family.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <span>Gérer</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
