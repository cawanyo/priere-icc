"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MoreHorizontal, UserMinus, ShieldCheck } from "lucide-react";
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
    if (res.success) {
      toast.success("Membre retiré de l'équipe.");
    } else {
      toast.error(res.message);
    }
    setMemberToRemove(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <Card key={member.id} className="group relative overflow-hidden border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all">
            
            {/* Bannière décorative */}
            <div className="h-20 bg-gradient-to-r from-indigo-50 to-pink-50" />
            
            {/* Avatar Centré */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2">
                <Avatar className="h-20 w-20 border-4 border-white shadow-sm">
                    <AvatarImage src={member.image} />
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xl font-bold">
                        {member.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            </div>

            {/* Menu Actions (3 points) */}
            <div className="absolute top-3 right-3">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                            className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                            onClick={() => setMemberToRemove(member.id)}
                        >
                            <UserMinus className="mr-2 h-4 w-4" /> Retirer de l'équipe
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardContent className="pt-12 text-center pb-6">
                <h3 className="font-bold text-lg text-gray-900 mb-1">{member.name}</h3>
                <Badge variant="secondary" className="mb-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Intercesseur
                </Badge>

                <div className="space-y-2 text-sm text-gray-500">
                    {member.email && (
                        <div className="flex items-center justify-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                            <span className="truncate max-w-[200px]">{member.email}</span>
                        </div>
                    )}
                    {member.phone && (
                        <div className="flex items-center justify-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            <span>{member.phone}</span>
                        </div>
                    )}
                </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pop-up de confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette personne perdra son statut d'Intercesseur et redeviendra un utilisateur standard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoval} className="bg-red-600 hover:bg-red-700 text-white">
              Confirmer le retrait
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}