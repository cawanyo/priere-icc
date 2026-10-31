"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Users, Search } from "lucide-react";
import { addMemberToFamily, removeMemberFromFamily } from "@/app/actions/prayer-house";
import { toast } from "sonner";
import { ConfirmDelete } from "../DeleteConfirm";
import { SearchableUserSelect } from "../SearchUserSelect";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { REALTIME_CHANNELS } from "@/lib/realtime-channels";

interface MemberManagerProps {
  familyId: string;
  members: any[];
  candidates: any[];
}

export function FamilyMemberManager({ familyId, members, candidates }: MemberManagerProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Synchronisation temps réel automatique
  useRealtimeSync({
    channel: REALTIME_CHANNELS.PRAYER_HOUSE,
    onUpdate: () => {
      router.refresh();
    },
  });

  const filteredMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const name = (member.name || "").toLowerCase();
    const phone = (member.phone || "").toLowerCase();
    const email = (member.email || "").toLowerCase();
    return name.includes(query) || phone.includes(query) || email.includes(query);
  });

  const handleAdd = async () => {
    if (!selectedCandidateId) return;
    setIsAdding(true);
    const res = await addMemberToFamily(familyId, selectedCandidateId);
    setIsAdding(false);
    if (res.success) {
      toast.success("Membre ajouté à la famille");
      setSelectedCandidateId("");
      setIsDialogOpen(false);
      router.refresh();
    }
  };

  const handleRemove = async (userId: string) => {
    const res = await removeMemberFromFamily(userId, familyId);
    if (res.success) {
      toast.success("Membre retiré");
      router.refresh();
    }
  };

  return (
    <Card className="h-full border-slate-200/80 shadow-xs rounded-2xl overflow-hidden">
      <CardHeader className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
            <Users className="mr-2 h-4 w-4 text-indigo-600" />
            Membres ({members.length})
          </CardTitle>
            
          {/* Modale d'ajout */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 px-2.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer text-xs font-semibold">
                <UserPlus className="h-3.5 w-3.5 mr-1 text-indigo-600" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-md rounded-2xl">
              <DialogHeader><DialogTitle className="text-sm font-bold">Ajouter un membre</DialogTitle></DialogHeader>
              <div className="py-3 space-y-3">
                <p className="text-xs text-slate-500">Recherchez un conducteur de prière disponible :</p>
                
                {candidates.length > 0 ? (
                  <SearchableUserSelect 
                    users={candidates}
                    onSelect={(id) => setSelectedCandidateId(id)}
                    placeholder="Choisir un conducteur..."
                  />
                ) : (
                  <div className="text-center p-4 bg-slate-50 rounded-xl text-xs text-slate-500">
                    Aucun conducteur disponible.
                  </div>
                )}

                <Button onClick={handleAdd} disabled={!selectedCandidateId || isAdding} className="w-full bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl h-9 text-xs font-semibold cursor-pointer">
                  {isAdding ? "Ajout en cours..." : "Confirmer l'ajout"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-3.5 space-y-2.5">
        {/* Input de recherche sobre */}
        {members.length > 0 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Rechercher une sentinelle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs rounded-xl border-slate-200 bg-white placeholder:text-slate-400 focus-visible:ring-indigo-500"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5 max-h-[480px] overflow-y-auto pr-0.5">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-2xs transition-all group"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <Avatar className="h-7 w-7 border border-slate-100 bg-slate-50 shrink-0">
                    <AvatarImage src={member.image} />
                    <AvatarFallback className="bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                      {member.name?.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {member.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {member.phone || member.email || "Pas de numéro"}
                    </p>
                  </div>
                </div>
                <ConfirmDelete
                  onConfirm={async () => {
                    await removeMemberFromFamily(member.id, familyId);
                  }}
                  description="Ce membre sera retiré de la famille mais son compte utilisateur existera toujours."
                />
              </div>
            ))
          ) : members.length > 0 ? (
            <div className="text-center py-6 text-slate-400 border border-dashed rounded-xl bg-slate-50/50">
              <p className="text-xs">Aucun membre ne correspond à votre recherche.</p>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 border-2 border-dashed rounded-xl bg-slate-50/50">
              <p className="text-xs">Aucun membre dans cette maison.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}