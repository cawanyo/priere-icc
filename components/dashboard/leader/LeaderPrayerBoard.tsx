"use client";

import { useState } from "react";
import { getGlobalPrayers, PrayerFilters as FilterType } from "@/app/actions/leader";
import { PrayerFilters, FilterState } from "@/components/dashboard/prayer/PrayerFilters";
import { PrayerAdminList } from "./PrayerAdminList";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useRealtime } from "@/hooks/useRealRime";

export function LeaderPrayerBoard() {
  // État local des filtres
  const [filters, setFilters] = useState<FilterType>({
    status: "",
    type: "",
    search: "",
    page: 1,
    limit: 12
  });

  // Hook Temps Réel
  const result = useRealtime({
    queryKey: ['leader-prayers', JSON.stringify(filters)],
    
    initialData: { 
        prayers: [], 
        metadata: { totalPages: 0, currentPage: 1, totalCount: 0 } 
    },
    
    // Adaptateur pour correspondre au format attendu par useRealtime
    fetcher: async () => {
        const res = await getGlobalPrayers(filters);
        return {
            success: res.success,
            data: {
                prayers: res.data || [],
                metadata: res.metadata || { totalPages: 0, currentPage: 1, totalCount: 0 }
            },
            error: res.error
        };
    },
    
    refetchInterval: 5000,
  });

  // @ts-ignore
  const prayers = result?.prayers || [];
  // @ts-ignore
  const metadata = result?.metadata;

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Adapter le type venant de PrayerFilters (UI) vers le type de l'action (Server)
  const handleFilterChange = (newUiFilters: FilterState) => {
    setFilters(prev => ({
        ...prev,
        ...newUiFilters,
        page: 1 // Reset page
    }));
  };

  return (
    <div className="space-y-6">
      
      {/* En-tête avec compteur */}
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-serif font-bold tracking-tight text-indigo-900">
                Mur de Prières
            </h2>
            <p className="text-muted-foreground">
                Gérez et intercédez pour les requêtes de la communauté.
            </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border shadow-sm text-sm">
            <span className="text-gray-500">Total :</span> 
            <span className="ml-2 text-xl font-bold text-pink-600">{metadata?.totalCount || 0}</span>
        </div>
      </div>

      {/* Barre de Filtres Contrôlée */}
      {/* Note: On doit mapper le state local vers le format attendu par PrayerFilters UI */}
      <PrayerFilters 
        filters={{
            status: filters.status || "",
            type: filters.type || "",
            search: filters.search || "",
            dateOrder: "desc", // Par défaut pour le leader
            startDate: filters.startDate,
            endDate: filters.endDate
        }} 
        onFilterChange={handleFilterChange} 
      />

      {/* Liste des cartes */}
      <PrayerAdminList prayers={prayers} />

      {/* Pagination Locale */}
      {metadata && metadata.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 pb-8">
            <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(metadata.currentPage - 1)}
                disabled={metadata.currentPage <= 1}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 font-medium">
                Page {metadata.currentPage} sur {metadata.totalPages}
            </span>
            <Button
                variant="outline"
                size="icon"
                onClick={() => handlePageChange(metadata.currentPage + 1)}
                disabled={metadata.currentPage >= metadata.totalPages}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      )}
    </div>
  );
}