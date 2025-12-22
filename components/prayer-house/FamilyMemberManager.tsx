"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Users } from "lucide-react";
import { addMemberToFamily, removeMemberFromFamily } from "@/app/actions/prayer-house";
import { toast } from "sonner";
import { ConfirmDelete } from "../DeleteConfirm";
import { SearchableUserSelect } from "../SearchUserSelect";
import { cn } from "@/lib/utils";

interface MemberManagerProps {
  familyId: string;
  members: any[];
  candidates: any[];
}

export function FamilyMemberManager({ familyId, members, candidates }: MemberManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
    

  const handleAdd = async () => {
    if (!selectedCandidateId) return;
    setIsAdding(true);
    console.log("Adding member:", selectedCandidateId);
    const res = await addMemberToFamily(familyId, selectedCandidateId);
    console.log("Add member result:", res);
    setIsAdding(false);
    if (res.success) {
      toast.success("Membre ajouté à la famille");
      setSelectedCandidateId("");
      setIsDialogOpen(false);
    }
  };

  const handleRemove = async (userId: string) => {
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="icon" variant="outline" className="...">
                        <UserPlus className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Ajouter un membre</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-gray-500">Recherchez un conducteur de prière disponible :</p>
                        
                        {candidates.length > 0 ? (
                            // --- UTILISATION DU NOUVEAU COMPOSANT ---
                            <SearchableUserSelect 
                                users={candidates}
                                onSelect={(id) => setSelectedCandidateId(id)}
                                placeholder="Choisir un conducteur..."
                            />
                        ) : (
                            <div className="text-center p-4 bg-gray-50 rounded text-sm text-gray-500">
                                Aucun conducteur disponible.
                            </div>
                        )}

                        <Button onClick={handleAdd} disabled={!selectedCandidateId || isAdding}  className={cn("w-full bg-indigo-900")}>
                            {isAdding ? "Ajout en cours..." : "Confirmer l'ajout"}
                        </Button>
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
                        <ConfirmDelete 
                            onConfirm={async () => {
                                // On passe une fonction anonyme qui appelle la Server Action avec l'ID
                                await removeMemberFromFamily(member.id, familyId);
                            }}
                            description="Ce membre sera retiré de la famille mais son compte utilisateur existera toujours."
                        />
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