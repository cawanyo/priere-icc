"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, UserMinus, Shield, Users } from "lucide-react";
import { addMemberToFamily, removeMemberFromFamily } from "@/app/actions/prayer-house";
import { toast } from "sonner";

interface MemberManagerProps {
  familyId: string;
  members: any[];
  candidates: any[];
}

export function FamilyMemberManager({ familyId, members, candidates }: MemberManagerProps) {
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!selectedCandidate) return;
    setIsAdding(true);
    const res = await addMemberToFamily(familyId, selectedCandidate);
    setIsAdding(false);

    if (res.success) {
        toast.success("Membre ajouté !");
        setSelectedCandidate("");
        document.getElementById("close-dialog")?.click(); 
    } else {
        toast.error("Erreur ajout");
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Retirer ce membre de la famille ?")) return;
    const res = await removeMemberFromFamily(userId, familyId);
    if (res.success) toast.success("Membre retiré");
  };

  return (
    <Card className="h-full border-indigo-100 shadow-sm">
      <CardHeader className="pb-3 border-b bg-gray-50/50">
        <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-indigo-900 flex items-center">
                <Users className="mr-2 h-4 w-4 text-pink-600" />
                Membres ({members.length})
            </CardTitle>
            
            {/* Modale d'ajout */}
            <Dialog>
                <DialogTrigger asChild>
                    <Button size="icon" variant="outline" className="h-8 w-8 border-dashed border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50">
                        <UserPlus className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Ajouter un membre</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-gray-500">Sélectionnez un conducteur de prière disponible :</p>
                        
                        {candidates.length > 0 ? (
                            <Select onValueChange={setSelectedCandidate}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir un conducteur..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {candidates.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6"><AvatarImage src={c.image}/><AvatarFallback>{c.name[0]}</AvatarFallback></Avatar>
                                                {c.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="text-center p-4 bg-gray-50 rounded text-sm text-gray-500">
                                Aucun conducteur disponible.
                            </div>
                        )}

                        <Button onClick={handleAdd} disabled={!selectedCandidate || isAdding} className="w-full bg-indigo-900">
                            Confirmer l'ajout
                        </Button>
                        <button id="close-dialog" className="hidden">Fermer</button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-3">
        <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
            {members.length > 0 ? (
                members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 bg-white hover:border-indigo-100 hover:shadow-sm transition-all group">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Avatar className="h-8 w-8 border bg-gray-50">
                                <AvatarImage src={member.image} />
                                <AvatarFallback className="bg-indigo-50 text-indigo-700 text-xs font-bold">
                                    {member.name?.slice(0,1)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                                <p className="text-[10px] text-gray-400 truncate">{member.phone || "Pas de numéro"}</p>
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemove(member.id)}
                            className="h-7 w-7 text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <UserMinus className="h-3 w-3" />
                        </Button>
                    </div>
                ))
            ) : (
                <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg bg-gray-50/50">
                    <p className="text-sm">Aucun membre.</p>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}