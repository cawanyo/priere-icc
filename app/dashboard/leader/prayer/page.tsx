// app/dashboard/leader/prayer/page.tsx
import { getGlobalPrayers } from "@/app/actions/leader";
import { PrayerFilters } from "@/components/dashboard/prayer/PrayerFilters"; 
import { PrayerAdminList } from "@/components/dashboard/leader/PrayerAdminList";

// 1. Définir le type des props comme une Promise
type SearchParams = Promise<{ [key: string]: string | undefined }>;

export default async function LeaderPrayerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  
  // 2. AWAIT les searchParams avant de les utiliser
  const params = await searchParams;

  const filters = {
    status: params.status,
    type: params.type,
    search: params.search,
    startDate: params.startDate,
    endDate: params.endDate,
  };

  const { data: prayers, error } = await getGlobalPrayers(filters);

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
            <span className="ml-2 text-xl font-bold text-pink-600">{prayers?.length || 0}</span>
        </div>
      </div>

      {/* Barre de filtres */}
      <PrayerFilters />

      {/* Liste de cartes */}
      <PrayerAdminList prayers={prayers || []} />
    </div>
  );
}