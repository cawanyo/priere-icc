"use client";

import { useState } from "react";
import { getUserPrayers } from "@/app/actions/prayer";
import { PrayerFilters, FilterState } from "./PrayerFilters";
import { PrayerCard } from "./PrayerCard";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRealtime } from "@/hooks/useRealRime";

export function UserPrayerBoard() {
  const [filters, setFilters] = useState<FilterState & { page: number, limit: number }>({
    status: "",
    type: "",
    search: "",
    dateOrder: "desc",
    page: 1,
    limit: 9
  });

  // --- CHARGEMENT DES DONNÉES (TEMPS RÉEL) ---
  const result = useRealtime({
    queryKey: ['user-prayers', JSON.stringify(filters)],
    
    // CORRECTION 1 : initialData doit correspondre à la structure retournée par le fetcher ci-dessous
    initialData: { 
        prayers: [], 
        metadata: { totalPages: 0, currentPage: 1, totalCount: 0 } 
    },
    
    // CORRECTION 2 : On adapte la réponse de l'action pour tout mettre dans 'data'
    fetcher: async () => {
        const res = await getUserPrayers(filters);
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

  // On accède maintenant directement aux propriétés de l'objet
  const prayers = result?.prayers || [];
  const metadata = result?.metadata;

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8">
      
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-serif font-bold tracking-tight text-indigo-900">Mes Prières</h2>
            <p className="text-muted-foreground">
                Suivez l'évolution de vos requêtes ({metadata?.totalCount || 0}).
            </p>
        </div>
        <Link href="/prayer">
            <Button className="bg-pink-600 hover:bg-pink-700 text-white shadow-sm">
                <Plus className="mr-2 h-4 w-4" /> Nouvelle requête
            </Button>
        </Link>
      </div>

      {/* Filtres Contrôlés */}
      <PrayerFilters 
        filters={filters} 
        onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))} 
      />

      {/* Grille */}
      {prayers.length > 0 ? (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {prayers.map((prayer: any) => (
                    <PrayerCard key={prayer.id} prayer={prayer} />
                ))}
            </div>

            {/* Pagination Locale */}
            {metadata && metadata.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
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
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <p className="text-gray-500 font-medium mb-4">Aucune prière trouvée.</p>
            <Link href="/prayer">
                <Button variant="outline">Déposer une requête</Button>
            </Link>
        </div>
      )}
    </div>
  );
}