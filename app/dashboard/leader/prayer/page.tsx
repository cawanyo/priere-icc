// app/dashboard/leader/prayer/page.tsx
export const dynamic = "force-dynamic";

import { getGlobalPrayers } from "@/app/actions/leader";
import { PrayerFilters } from "@/components/dashboard/prayer/PrayerFilters"; 
import { PrayerAdminList } from "@/components/dashboard/leader/PrayerAdminList";
import { PaginationControl } from "@/components/ui/pagination-control"; // Import

type SearchParams = Promise<{ [key: string]: string | undefined }>;

export default async function LeaderPrayerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;

  const filters = {
    status: params.status,
    type: params.type,
    search: params.search,
    startDate: params.startDate,
    endDate: params.endDate,
    page: currentPage,
    limit: 9, // On affiche plus de cartes pour le leader
  };

  const { data: prayers, metadata, error } = await getGlobalPrayers(filters);

  if (error) return <div className="p-8 text-red-500 bg-red-50 rounded-lg">{error}</div>;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gray-50/30 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-serif font-bold tracking-tight text-indigo-900">
                Mur de Prières
            </h2>
            <p className="text-muted-foreground">
                Gérez et intercédez pour les requêtes de la communauté.
            </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border shadow-sm text-sm">
            <span className="text-gray-500">Total requêtes :</span> 
            <span className="ml-2 text-xl font-bold text-pink-600">{metadata?.totalCount || 0}</span>
        </div>
      </div>

      {/* Barre de filtres */}
      <PrayerFilters />

      {/* Liste de cartes */}
      <PrayerAdminList prayers={prayers || []} />

      {/* Pagination */}
      {metadata && (
        <PaginationControl 
            totalPages={metadata.totalPages} 
            currentPage={metadata.currentPage} 
            className="mt-8 pb-8"
        />
      )}
    </div>
  );
}