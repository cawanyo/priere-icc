// app/dashboard/user/testimonies/page.tsx
export const dynamic = "force-dynamic";

import { getUserTestimonies } from "@/app/actions/testimony";
import { TestimonyCard } from "@/components/testimonies/TestimonyCard";
import { PaginationControl } from "@/components/ui/pagination-control"; // Import
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

type SearchParams = Promise<{ [key: string]: string | undefined }>;

export default async function UserTestimoniesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const LIMIT = 6;

  const { data: testimonies, metadata } = await getUserTestimonies({ 
    page: currentPage, 
    limit: LIMIT 
  });

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-gray-50/30 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-serif font-bold tracking-tight text-indigo-900">Mes Témoignages</h2>
            <p className="text-muted-foreground">
                Retrouvez ici l'historique de vos partages et leur statut ({metadata?.totalCount || 0}).
            </p>
        </div>
        <Button asChild className="bg-pink-600 hover:bg-pink-700">
            <Link href="/testimonies/submit">
                <Plus className="mr-2 h-4 w-4" /> Nouveau
            </Link>
        </Button>
      </div>

      {testimonies && testimonies.length > 0 ? (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonies.map((t) => (
                    <TestimonyCard key={t.id} testimony={t} showStatus />
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
        <div className="col-span-full flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <p className="text-gray-500 font-medium mb-4">Vous n'avez pas encore partagé de témoignage.</p>
            <Button asChild variant="outline">
                <Link href="/testimonies/submit">Raconter mon histoire</Link>
            </Button>
        </div>
      )}
    </div>
  );
}