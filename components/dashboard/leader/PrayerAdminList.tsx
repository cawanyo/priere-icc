"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays, Phone, Mail } from "lucide-react";
import { PrayerStatusBadge } from "./PrayerStatusBadge";
import { PrayerDetails } from "./PrayerDetails";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PrayerAdminListProps {
  prayers: any[]; // On reçoit juste les données
}

export function PrayerAdminList({ prayers }: PrayerAdminListProps) {
  const [selectedPrayer, setSelectedPrayer] = useState<any | null>(null);

  if (!prayers || prayers.length === 0) {
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
            className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-gray-100 flex flex-col overflow-hidden"
            onClick={() => setSelectedPrayer(prayer)}
          >
            <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0 bg-gray-50/30 pt-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border bg-white">
                        <AvatarImage src={prayer.user?.image} />
                        <AvatarFallback className="text-xs font-bold text-indigo-600 bg-indigo-50">
                            {prayer.name?.slice(0,2).toUpperCase() || "??"}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-bold text-gray-900 leading-none mb-1">
                            {prayer.name || "Anonyme"}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center">
                            <CalendarDays className="w-3 h-3 mr-1" />
                            {format(new Date(prayer.createdAt), "d MMM", { locale: fr })}
                        </p>
                    </div>
                </div>
                <PrayerStatusBadge status={prayer.status} />
            </CardHeader>
            
            <CardContent className="flex-1 pt-4">
                <div className="mb-3">
                    <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md tracking-wide">
                        {prayer.subjectType}
                    </span>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed mb-4">
                    {prayer.content}
                </p>

                {(prayer.phone || prayer.email) && (
                    <div className="flex flex-col gap-1.5 mt-auto pt-3 border-t border-dashed border-gray-100">
                        {prayer.phone && (
                            <div className="flex items-center text-xs text-gray-500">
                                <Phone className="w-3 h-3 mr-2 text-pink-500" />
                                {prayer.phone}
                            </div>
                        )}
                        {prayer.email && (
                            <div className="flex items-center text-xs text-gray-500">
                                <Mail className="w-3 h-3 mr-2 text-indigo-500" />
                                <span className="truncate">{prayer.email}</span>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-0 pb-0 h-10 border-t bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50/50 transition-colors">
                <span className="text-xs font-medium text-gray-500 group-hover:text-indigo-600 flex items-center transition-colors">
                    Voir la fiche complète <ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover:translate-x-1" />
                </span>
            </CardFooter>
          </Card>
        ))}
      </div>

      <PrayerDetails 
        prayer={selectedPrayer} 
        open={!!selectedPrayer} 
        onClose={() => setSelectedPrayer(null)} 
      />
    </>
  );
}