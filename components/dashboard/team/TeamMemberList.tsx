"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MoreVertical, UserMinus, Mic2, Crown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { removeTeamMember } from "@/app/actions/team";

interface TeamMemberListProps {
  members: any[];
}

export function TeamMemberList({ members }: TeamMemberListProps) {
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const confirmRemoval = async () => {
    if (!memberToRemove) return;
    const res = await removeTeamMember(memberToRemove);
    if (res.success) toast.success("Membre retiré.");
    else toast.error(res.message);
    setMemberToRemove(null);
  };

  if (members.length === 0) {
    return <div className="text-center py-8 text-sm text-gray-500 italic">Aucun membre dans cette équipe.</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => {
            const isLeader = member.role === "PRAYER_LEADER";
            const RoleIcon = isLeader ? Mic2 : Crown;
            const roleColor = isLeader ? "text-indigo-600 bg-indigo-50 border-indigo-100" : "text-pink-600 bg-pink-50 border-pink-100";
            const roleLabel = isLeader ? "Conducteur" : "Intercesseur";

            return (
              <Card key={member.id} className="relative overflow-hidden border-gray-100 hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-12 w-12 border">
                        <AvatarImage src={member.image} />
                        <AvatarFallback className="bg-gray-100 text-gray-600 font-bold">
                            {member.name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 overflow-hidden">
                        <h4 className="font-semibold text-gray-900 truncate">{member.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={`text-[10px] px-2 py-0 h-5 font-medium border ${roleColor}`}>
                                <RoleIcon className="w-3 h-3 mr-1" /> {roleLabel}
                            </Badge>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                                className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                                onClick={() => setMemberToRemove(member.id)}
                            >
                                <UserMinus className="mr-2 h-4 w-4" /> Retirer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardContent>
              </Card>
            );
        })}
      </div>

      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>Il redeviendra un utilisateur standard.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoval} className="bg-red-600 hover:bg-red-700 text-white">Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}