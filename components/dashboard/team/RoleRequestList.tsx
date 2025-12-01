"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Phone, Mail, Loader2, Crown, Mic2 } from "lucide-react";
import { toast } from "sonner";
import { updateRoleRequestStatus } from "@/app/actions/team";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RoleRequestListProps {
  requests: any[];
}

export function RoleRequestList({ requests }: RoleRequestListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAction = async (requestId: string, status: "APPROVED" | "REJECTED") => {
    setLoadingId(requestId);
    const res = await updateRoleRequestStatus(requestId, status);
    setLoadingId(null);

    if (res.success) {
      toast.success(status === "APPROVED" ? "Candidature acceptée !" : "Candidature refusée.");
    } else {
      toast.error(res.message);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
        <p className="text-muted-foreground font-medium text-sm">Aucune demande en attente dans cette catégorie.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <Card key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border-gray-100">
          
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={req.user.image} />
              <AvatarFallback className="bg-gray-100 text-gray-700 font-bold text-xs">
                {req.user.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900 text-sm">{req.user.name}</h4>
                <span className="text-[10px] text-gray-400">
                  {format(new Date(req.createdAt), "d MMM", { locale: fr })}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                {req.user.email && (
                    <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {req.user.email}
                    </span>
                )}
                {req.user.phone && (
                    <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {req.user.phone}
                    </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button 
                size="sm" 
                variant="outline" 
                className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => handleAction(req.id, "REJECTED")}
                disabled={!!loadingId}
            >
               {loadingId === req.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <X className="h-3 w-3 mr-1" />}
               Refuser
            </Button>
            <Button 
                size="sm" 
                className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleAction(req.id, "APPROVED")}
                disabled={!!loadingId}
            >
               {loadingId === req.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Check className="h-3 w-3 mr-1" />}
               Valider
            </Button>
          </div>

        </Card>
      ))}
    </div>
  );
}