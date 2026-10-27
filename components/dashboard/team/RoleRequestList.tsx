"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Phone, Mail, Loader2, Crown, Mic2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { updateRoleRequestStatus } from "@/app/actions/team";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface RoleRequestItem {
  id: string;
  userId: string;
  role: string;
  status: string;
  createdAt: string | Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    image?: string | null;
  };
}

interface RoleRequestListProps {
  requests: RoleRequestItem[];
  onUpdated?: () => void;
}

export function RoleRequestList({ requests, onUpdated }: RoleRequestListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAction = async (requestId: string, status: "APPROVED" | "REJECTED") => {
    setLoadingId(requestId);
    const res = await updateRoleRequestStatus(requestId, status);
    setLoadingId(null);

    if (res.success) {
      toast.success(status === "APPROVED" ? "Candidature acceptée !" : "Candidature refusée.");
      if (onUpdated) onUpdated();
    } else {
      toast.error(res.message || "Une erreur est survenue.");
    }
  };

  if (requests.length === 0) {
    return (
      <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
        <p className="text-muted-foreground font-medium text-sm">Aucune demande trouvée dans cette catégorie.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <Card key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border-gray-100 hover:border-gray-200 transition-colors">
          
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 border shrink-0">
              <AvatarImage src={req.user.image || undefined} />
              <AvatarFallback className="bg-gray-100 text-gray-700 font-bold text-xs">
                {req.user.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-semibold text-gray-900 text-sm">{req.user.name}</h4>
                
                {req.role === "PRAYER_LEADER" ? (
                  <Badge variant="outline" className="text-[10px] font-medium bg-indigo-50/70 text-indigo-700 border-indigo-200">
                    <Mic2 className="h-3 w-3 mr-1" /> Conducteur
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] font-medium bg-pink-50/70 text-pink-700 border-pink-200">
                    <Crown className="h-3 w-3 mr-1" /> Intercesseur
                  </Badge>
                )}

                <span className="text-[11px] text-gray-400">
                  {format(new Date(req.createdAt), "d MMM yyyy", { locale: fr })}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                {req.user.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-gray-400" /> {req.user.email}
                  </span>
                )}
                {req.user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-gray-400" /> {req.user.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {req.status === "PENDING" && (
              <>
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
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleAction(req.id, "APPROVED")}
                  disabled={!!loadingId}
                >
                  {loadingId === req.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Check className="h-3 w-3 mr-1" />}
                  Valider
                </Button>
              </>
            )}

            {req.status === "APPROVED" && (
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium py-1 px-2.5 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Validée
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[11px] text-gray-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleAction(req.id, "REJECTED")}
                  disabled={!!loadingId}
                >
                  {loadingId === req.id ? <Loader2 className="h-3 w-3 animate-spin"/> : "Rétrograder"}
                </Button>
              </div>
            )}

            {req.status === "REJECTED" && (
              <div className="flex items-center gap-2">
                <Badge className="bg-red-50 text-red-700 border border-red-200 font-medium py-1 px-2.5 flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5 text-red-600" /> Refusée
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[11px] text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                  onClick={() => handleAction(req.id, "APPROVED")}
                  disabled={!!loadingId}
                >
                  {loadingId === req.id ? <Loader2 className="h-3 w-3 animate-spin"/> : "Valider"}
                </Button>
              </div>
            )}
          </div>

        </Card>
      ))}
    </div>
  );
}
