"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { PrayerStatusBadge } from "./PrayerStatusBadge";
import { PrayerDetails } from "./PrayerDetails";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PrayerAdminTableProps {
  prayers: any[];
}

export function PrayerAdminTable({ prayers }: PrayerAdminTableProps) {
  const [selectedPrayer, setSelectedPrayer] = useState<any | null>(null);

  return (
    <>
      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sujet</TableHead>
              <TableHead>Demandeur</TableHead>
              <TableHead>Contenu (Aperçu)</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prayers.map((prayer) => (
              <TableRow key={prayer.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => setSelectedPrayer(prayer)}>
                <TableCell className="font-medium text-indigo-900">
                    {prayer.subjectType}
                </TableCell>
                <TableCell>
                    <div className="flex flex-col">
                        <span className="font-medium">{prayer.name || "Anonyme"}</span>
                        <span className="text-xs text-muted-foreground">{prayer.email || prayer.phone || "-"}</span>
                    </div>
                </TableCell>
                <TableCell className="max-w-[300px]">
                    <p className="truncate text-muted-foreground text-sm">
                        {prayer.content}
                    </p>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(prayer.createdAt), "dd/MM/yyyy", { locale: fr })}
                </TableCell>
                <TableCell>
                    <PrayerStatusBadge status={prayer.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedPrayer(prayer); }}>
                    <Eye className="h-4 w-4 text-gray-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {prayers.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Aucune prière trouvée pour ces filtres.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PrayerDetails 
        prayer={selectedPrayer} 
        open={!!selectedPrayer} 
        onClose={() => setSelectedPrayer(null)} 
      />
    </>
  );
}