"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, List, Calendar } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// Import des DEUX types de documents
import { PlanningPdfDocument } from "./PlanningPdfDocument"; // Liste
import { PlanningPdfCalendar } from "./PlanningPdfCalendar"; // Calendrier

interface DownloadButtonProps {
  events: any[];
  title: string;
  subtitle: string;
  startDate: Date;
  endDate: Date;
  fileName?: string;
}

export function DownloadPlanningButton(props: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async (type: 'list' | 'calendar') => {
    try {
      setLoading(true);
      
      const { pdf } = await import("@react-pdf/renderer");
      
      // Choix du document en fonction du type demandé
      const DocumentComponent = type === 'calendar' 
        ? <PlanningPdfCalendar {...props} /> 
        : <PlanningPdfDocument {...props} />; // Par défaut : Liste

      const blob = await pdf(DocumentComponent).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // On ajoute un suffixe au nom de fichier
      const suffix = type === 'calendar' ? '-cal' : '-list';
      link.download = (props.fileName || "planning.pdf").replace('.pdf', `${suffix}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("PDF téléchargé !");
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      toast.error("Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          disabled={loading}
          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 gap-2 transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {loading ? "Génération..." : "Exporter PDF"}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleDownload('calendar')} className="cursor-pointer">
            <Calendar className="mr-2 h-4 w-4 text-indigo-500" />
            Format Calendrier (Semainier)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload('list')} className="cursor-pointer">
            <List className="mr-2 h-4 w-4 text-pink-500" />
            Format Liste (Détaillé)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}