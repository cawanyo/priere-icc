// app/dashboard/user/prayer/page.tsx
import { getUserPrayers } from "@/app/actions/prayer";
import { PrayerFilters } from "@/components/dashboard/prayer/PrayerFilters";
import { PrayerCard } from "@/components/dashboard/prayer/PrayerCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

// Définition du type pour Next.js 15
type SearchParams = Promise<{ [key: string]: string | undefined }>;

export default async function UserPrayersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  
  // Await des paramètres (Next.js 15)
  const params = await searchParams;

  // Construction des filtres
  const filters = {
    status: params.status,
    type: params.type,
    search: params.search,       // Nouveau
    startDate: params.startDate, // Nouveau
    endDate: params.endDate,     // Nouveau
    dateOrder: (params.dateOrder as 'asc' | 'desc') || 'desc',
  };

  const { data: prayers, error } = await getUserPrayers(filters);

  if (error) {
    return <div className="p-8 text-red-500 bg-red-50 rounded-lg border border-red-100">Erreur : {error}</div>;
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-gray-50/30 min-h-screen">
      
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-serif font-bold tracking-tight text-indigo-900">Mes Prières</h2>
            <p className="text-muted-foreground">
                Suivez l'évolution de vos requêtes et témoignez de la main de Dieu.
            </p>
        </div>
        <Link href="/prayer">
            <Button className="bg-pink-600 hover:bg-pink-700 text-white shadow-sm">
                <Plus className="mr-2 h-4 w-4" /> Nouvelle requête
            </Button>
        </Link>
      </div>

      {/* Barre de filtres (La même que celle du Leader, maintenant fonctionnelle ici aussi) */}
      <PrayerFilters />

      {/* Grille de contenu */}
      {prayers && prayers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prayers.map((prayer) => (
            <PrayerCard key={prayer.id} prayer={prayer} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <p className="text-gray-500 font-medium mb-4">Aucune prière trouvée pour ces critères.</p>
            {(filters.status || filters.type || filters.search || filters.startDate) ? (
                <p className="text-sm text-muted-foreground">Essayez de modifier vos filtres.</p>
            ) : (
                <Link href="/prayer">
                    <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">Déposer une requête</Button>
                </Link>
            )}
        </div>
      )}
    </div>
  );
}