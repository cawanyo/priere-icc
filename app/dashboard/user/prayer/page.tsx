// app/dashboard/user/prayer/page.tsx
import { getUserPrayers } from "@/app/actions/prayer";
import { PrayerFilters } from "@/components/dashboard/prayer/PrayerFilters";
import { PrayerCard } from "@/components/dashboard/prayer/PrayerCard";
import { PaginationControl } from "@/components/ui/pagination-control"; // Import
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

type SearchParams = Promise<{ [key: string]: string | undefined }>;

export default async function UserPrayersPage({
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
    dateOrder: (params.dateOrder as 'asc' | 'desc') || 'desc',
    page: currentPage,
    limit: 9, // Nombre de cartes par page
  };

  const { data: prayers, metadata, error } = await getUserPrayers(filters);

  if (error) return <div className="p-8 text-red-500 bg-red-50 rounded-lg">{error}</div>;

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-gray-50/30 min-h-screen">
      
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

      <PrayerFilters />

      {/* Grille */}
      {prayers && prayers.length > 0 ? (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prayers.map((prayer) => (
                <PrayerCard key={prayer.id} prayer={prayer} />
            ))}
            </div>
            
            {/* Pagination */}
            {metadata && (
                <PaginationControl 
                    totalPages={metadata.totalPages} 
                    currentPage={metadata.currentPage} 
                />
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