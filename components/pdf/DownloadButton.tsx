"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { NightWatchPdf } from "./NightWatchPdf";
import { useState, useEffect } from "react";

interface Props {
  weekDate: Date;
  familyName: string;
  schedules: any[];
}


export function DownloadNightButton({ weekDate, familyName, schedules }: Props) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return <Button variant="outline" disabled><Loader2 className="mr-2 h-4 w-4 animate-spin"/> PDF</Button>;

  return (
    <PDFDownloadLink
      document={<NightWatchPdf weekDate={weekDate} familyName={familyName} schedules={schedules} />}
      fileName={`planning-nuit-${familyName.replace(/\s+/g, '-').toLowerCase()}.pdf`}
    >
      {/* @ts-ignore */}
      {({ loading }) => (
        <Button variant="outline" disabled={loading} className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Télécharger PDF
        </Button>
      )}
    </PDFDownloadLink>
  );
}