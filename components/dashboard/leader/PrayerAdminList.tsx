"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays } from "lucide-react";
import { PrayerStatusBadge } from "./PrayerStatusBadge";
import { PrayerDetails } from "./PrayerDetails";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PrayerAdminListProps {
  prayers: any[];
}

export function PrayerAdminList({ prayers }: PrayerAdminListProps) {
  const [selectedPrayer, setSelectedPrayer] = useState<any | null>(null);

  if (prayers.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <p className="text-gray-500 font-medium">Aucune requête trouvée pour ces critères.</p>
        </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prayers.map((prayer) => (
          <Card 
            key={prayer.id} 
            className="group hover:shadow-md transition-all duration-300 cursor-pointer border-gray-100 flex flex-col"
            onClick={() => setSelectedPrayer(prayer)}
          >
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border">
                        <AvatarImage src={prayer.user?.image} />
                        <AvatarFallback className="text-xs bg-gray-100">{prayer.name?.slice(0,2).toUpperCase() || "??"}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-semibold text-gray-900 leading-none mb-1">{prayer.name || "Anonyme"}</p>
                        <p className="text-xs text-muted-foreground flex items-center">
                            <CalendarDays className="w-3 h-3 mr-1" />
                            {format(new Date(prayer.createdAt), "dd MMM", { locale: fr })}
                        </p>
                    </div>
                </div>
                <PrayerStatusBadge status={prayer.status} />
            </CardHeader>
            
            <CardContent className="flex-1">
                <div className="mb-2">
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {prayer.subjectType}
                    </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                    {prayer.content}
                </p>
            </CardContent>

            <CardFooter className="pt-3 border-t bg-gray-50/30">
                <Button variant="ghost" size="sm" className="w-full text-gray-500 hover:text-indigo-600 group-hover:bg-indigo-50">
                    Voir les détails <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Le Drawer de détails */}
      <PrayerDetails 
        prayer={selectedPrayer} 
        open={!!selectedPrayer} 
        onClose={() => setSelectedPrayer(null)} 
      />
    </>
  );
}