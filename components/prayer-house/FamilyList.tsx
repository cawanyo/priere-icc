"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Trash2, ArrowRight } from "lucide-react";
import { createPrayerFamily, deletePrayerFamily } from "@/app/actions/prayer-house";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export function FamilyList({ initialFamilies }: { initialFamilies: any[] }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!newFamilyName) return;
    setLoading(true);
    const res = await createPrayerFamily({ name: newFamilyName });
    setLoading(false);
    
    console.log(res);
    if (res.success) {
        toast.success("Famille créée");
        setIsCreateOpen(false);
        setNewFamilyName("");
        // Idéalement on refresh ou on utilise un router.refresh()
        window.location.reload(); 
    } else {
        toast.error("Erreur création");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Supprimer cette famille ?")) return;
    const res = await deletePrayerFamily(id);
    if (res.success) window.location.reload();
  };

  return (
    <div className="space-y-6">
        {/* Bouton Création */}
        <div className="flex justify-end">
             <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-indigo-900 hover:bg-indigo-800">
                        <Plus className="mr-2 h-4 w-4" /> Nouvelle Famille
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Créer une Famille</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label>Nom de la famille</Label>
                            <Input 
                                placeholder="Ex: Famille Éphraïm" 
                                value={newFamilyName}
                                onChange={(e) => setNewFamilyName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreate} disabled={loading}>
                            {loading ? "Création..." : "Créer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

        {/* Grille des Familles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialFamilies.map((family) => (
                <Card key={family.id} className="group hover:shadow-lg transition-all border-l-4 w-full text-xs md:text-sm" style={{ borderLeftColor: family.color }}>
                    <CardHeader className="flex flex-row items-center justify-between wrap-break-word space-y-0 pb-2 ">
                        <CardTitle className=" font-bold text-gray-800">
                            {family.name}
                        </CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(family.id)} className="text-gray-400 hover:text-red-500">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2  text-gray-500 mb-4">
                            <Users className="h-4 w-4" />
                            <span>{family._count.members} membres</span>
                        </div>
                        
                        {/* Aperçu des membres */}
                        <div className="flex -space-x-2 overflow-hidden h-8 mb-2">
                            {family.members.slice(0, 5).map((m: any, i: number) => (
                                <Avatar key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white">
                                    <AvatarImage src={m.image} />
                                    <AvatarFallback>{m.name?.slice(0,1)}</AvatarFallback>
                                </Avatar>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full bg-gray-50 text-indigo-700 hover:bg-indigo-50 border border-gray-200 text-xs  ">
                            <Link href={`/dashboard/leader/prayer-house/${family.id}`}>
                                <span className="font-bold tracking-wider mb-1 flex-1 whitespace-normal wrap-break-word text-left"> Gérer la famille  </span><ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    </div>
  );
}