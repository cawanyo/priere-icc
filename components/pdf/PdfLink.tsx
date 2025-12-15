// components/pdf/PDFLink.tsx
"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { NightWatchPdf } from "./NightWatchPdf";

interface Props {
  weekDate: Date;
  familyName: string;
  schedules: any[];
}

// Ce composant est exporté par défaut pour être chargé dynamiquement
export default function PDFLink({ weekDate, familyName, schedules }: Props) {
  return (
    <PDFDownloadLink
      document={<NightWatchPdf weekDate={weekDate} familyName={familyName} schedules={schedules} />}
      fileName={`planning-nuit-${familyName.replace(/\s+/g, '-').toLowerCase()}.pdf`}
    >
      {/* @ts-ignore */}
      {({ loading }) => (
        <Button 
            variant="outline" 
            disabled={loading} 
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {loading ? "Génération..." : "Télécharger PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}