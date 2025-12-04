// app/dashboard/leader/testimonies/page.tsx
export const dynamic = "force-dynamic";

import { getAllTestimonies } from "@/app/actions/testimony";
import { TestimonyAdminList } from "@/components/dashboard/leader/TestimonyAdminList";
import { PaginationControl } from "@/components/ui/pagination-control";
import { MessageSquareQuote } from "lucide-react";

type SearchParams = Promise<{ [key: string]: string | undefined }>;

export default async function LeaderTestimoniesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const statusFilter = params.status || "ALL";

  const { data: testimonies, metadata } = await getAllTestimonies({ 
    page: currentPage, 
    limit: 9,
    status: statusFilter
  });

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-gray-50/30 min-h-screen">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 shadow-sm">
            <MessageSquareQuote className="h-6 w-6" />
        </div>
        <div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-indigo-900">
                Modération des Témoignages
            </h2>
            <p className="text-muted-foreground">
                Validez, rejetez ou supprimez les témoignages de la communauté.
            </p>
        </div>
      </div>

      <TestimonyAdminList testimonies={testimonies || []} />

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