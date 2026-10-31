"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarCheck, UserMinus, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { selfAssignToEventSlot, selfRemoveFromEventSlot } from "@/app/actions/intercessor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SelfAssignModalProps {
  event: any | null; 
  isOpen: boolean;
  onClose: () => void;
  isAssigned: boolean; 
}

export function SelfAssignModal({ event, isOpen, onClose, isAssigned }: SelfAssignModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  if (!event) return null;

  const sessionUserId = (session?.user as any)?.id;
  const sessionUserEmail = session?.user?.email?.toLowerCase();
  const assignedUsers = event.users || event.intercessors || [];

  // Détection robuste : soit par prop, soit par ID ou email dans la liste des intercesseurs du créneau
  const isUserAssigned = Boolean(
    isAssigned ||
    assignedUsers.some((u: any) =>
      (sessionUserId && u.id === sessionUserId) ||
      (sessionUserEmail && u.email?.toLowerCase() === sessionUserEmail)
    )
  );

  const handleAssign = async () => {
    setLoading(true);
    const res = await selfAssignToEventSlot(event);
    setLoading(false);
    
    if (res.success) {
      toast.success(res.message);
      onClose();
    } else {
      toast.error(res.message);
    }
  };

  const handleRemove = async () => {
    if (!event.id) {
      toast.error("Identifiant du créneau manquant.");
      return;
    }

    setLoading(true);
    const res = await selfRemoveFromEventSlot(event.id);
    setLoading(false);

    if (res.success) {
      toast.success(res.message || "Vous vous êtes retiré(e) du créneau.");
      onClose();
    } else {
      toast.error(res.message || "Erreur lors du retrait.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-900">
            <CalendarCheck className="h-5 w-5" />
            {isUserAssigned ? "Se retirer du créneau" : "S'inscrire au créneau"}
          </DialogTitle>
          <DialogDescription>
            {format(new Date(event.date), "EEEE d MMMM", { locale: fr })} • {event.startTime} - {event.endTime}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-5">
            {/* Info Créneau */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="font-semibold text-gray-900">{event.title}</h4>
                {event.description && <p className="text-sm text-gray-500 mt-1">{event.description}</p>}
            </div>

            {/* LISTE DES INTERCESSEURS DÉJÀ PRÉSENTS */}
            <div>
                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Déjà positionnés ({assignedUsers.length})
                </h5>
                
                {assignedUsers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {assignedUsers.map((intercessor: any) => (
                            <div key={intercessor.id} className="flex items-center gap-2 bg-white border rounded-full pl-1 pr-3 py-1 shadow-sm">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={intercessor.image} />
                                    <AvatarFallback className="text-[9px] bg-indigo-100 text-indigo-700 font-bold">
                                        {intercessor.name?.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-gray-700 font-medium">{intercessor.name}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 italic bg-gray-50/50 p-2 rounded text-center border border-dashed">
                        Soyez le premier à vous inscrire sur ce créneau.
                    </p>
                )}
            </div>
            
            <p className="text-sm text-gray-600 pt-2 border-t mt-2">
                {isUserAssigned 
                    ? "Vous êtes actuellement positionné sur ce créneau. Souhaitez-vous annuler votre participation ?"
                    : "En validant, vous vous engagez à assurer la conduite ou l'intercession sur ce créneau."
                }
            </p>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
          
          {isUserAssigned ? (
            <Button variant="destructive" onClick={handleRemove} disabled={loading} className="cursor-pointer">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserMinus className="mr-2 h-4 w-4" />}
              Se retirer
            </Button>
          ) : (
            <Button className="bg-indigo-900 hover:bg-indigo-800 cursor-pointer" onClick={handleAssign} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Je prends ce créneau
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}