// components/pdf/DownloadNightButton.tsx
"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// On importe le fichier intermédiaire qu'on vient de créer.
// ssr: false garantit que le serveur ne touchera jamais aux fichiers PDF.
const PDFLink = dynamic(() => import("./PdfLink"), {
  ssr: false,
  loading: () => (
    <Button variant="outline" disabled>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Chargement...
    </Button>
  ),
});

interface Props {
  weekDate: Date;
  familyName: string;
  schedules: any[];
}

export function DownloadNightButton(props: Props) {
  return <PDFLink {...props} />;
}