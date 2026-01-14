"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, CalendarOff } from "lucide-react";
import { deleteUnavailability } from "@/app/actions/availability";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { normalizeDate } from "@/lib/utils";

interface AvailabilityListProps {
  items: any[];
  leaderMode?: boolean;
}

export const dynamic = "force-dynamic";
export function AvailabilityList({ items, leaderMode }: AvailabilityListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const res = await deleteUnavailability(id);
    setDeletingId(null);
    if (res.success) toast.success("Supprimé");
    else toast.error("Erreur");
  };

  if (items.length === 0) {
    return (
        <Card className="border-dashed border-2 shadow-none bg-gray-50/50">
            <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <CalendarOff className="h-10 w-10 mb-2 opacity-20" />
                <p>Aucune indisponibilité à venir.</p>
                <p className="text-xs">Vous êtes considéré comme disponible.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="border-none shadow-md h-full">
      <CardHeader>
        <CardTitle className="text-lg font-serif text-indigo-900">{leaderMode? 'Les' : 'Mes'} Absences à venir</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
            const startDate = normalizeDate(item.startDate);
            const endDate = normalizeDate(item.endDate);
            const isRange = startDate.getTime() !== endDate.getTime();
            return (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-white hover:border-pink-200 transition-colors group">
                    <div className="space-y-1">
                        {leaderMode && 
                          <div>
                              {item.user.name}
                          </div>
                          }
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                                {format(new Date(item.startDate), "d MMM", { locale: fr })}
                                {isRange && ` - ${format(new Date(endDate), "d MMM yyyy", { locale: fr })}`}
                                {!isRange && format(new Date(startDate), " yyyy", { locale: fr })}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.reason}</p>
                    </div>
                    {
                      leaderMode ? null :
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                        disabled={!!deletingId}
                        onClick={() => handleDelete(item.id)}
                    >
                        {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                    </Button>
            }
                </div>
            )
        })}
      </CardContent>
    </Card>
  );
}