"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, User, Phone, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateRoleRequestStatus } from "@/app/actions/team";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RoleRequestListProps {
  requests: any[];
}

export function RoleRequestList({ requests }: RoleRequestListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAction = async (requestId: string, status: "INTERCESSOR" | "REJECTED") => {
    setLoadingId(requestId);
    const res = await updateRoleRequestStatus(requestId, status);
    setLoadingId(null);

    if (res.success) {
      toast.success(status === "INTERCESSOR" ? "Candidature acceptée !" : "Candidature refusée.");
    } else {
      toast.error(res.message);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
        <div className="bg-white p-3 rounded-full shadow-sm mb-3">
            <User className="h-6 w-6 text-gray-300" />
        </div>
        <p className="text-muted-foreground font-medium">Aucune candidature en attente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <Card key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-pink-500 shadow-sm hover:shadow-md transition-shadow">
          
          {/* Info Candidat */}
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={req.user.image} />
              <AvatarFallback className="bg-pink-50 text-pink-700 font-bold">
                {req.user.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900">{req.user.name}</h4>
                <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">
                  {format(new Date(req.createdAt), "d MMM", { locale: fr })}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                {req.user.email && (
                    <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" /> {req.user.email}
                    </span>
                )}
                {req.user.phone && (
                    <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" /> {req.user.phone}
                    </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button 
                size="sm" 
                variant="outline" 
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => handleAction(req.id, "REJECTED")}
                disabled={!!loadingId}
            >
               {loadingId === req.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4 mr-1.5" />}
               Refuser
            </Button>
            <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleAction(req.id, "INTERCESSOR")}
                disabled={!!loadingId}
            >
               {loadingId === req.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4 mr-1.5" />}
               Accepter
            </Button>
          </div>

        </Card>
      ))}
    </div>
  );
}