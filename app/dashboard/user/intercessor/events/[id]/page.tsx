import { getIntercessorEventDetails } from "@/app/actions/intercessor";
import { IntercessorEventCalendar } from "@/components/dashboard/intercessor/events/IntercessorEventCalendar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function IntercessorEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { event, currentUserId, success } = await getIntercessorEventDetails(id);

  if (!success || !event) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-3">
        <p className="text-base font-semibold text-slate-700">Événement introuvable ou archivé.</p>
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link href="/dashboard/user/intercessor/events">Retour aux événements</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 px-4 sm:px-6 md:px-8 py-5 md:py-6 pb-28 md:pb-12 bg-[#f8fafc] min-h-screen">
      {/* Bouton de retour sobre */}
      <div>
        <Link 
          href="/dashboard/user/intercessor/events" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors py-1 px-2 -ml-2 rounded-lg"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Tous les événements</span>
        </Link>
      </div>

      <IntercessorEventCalendar 
        event={event} 
        currentUserId={currentUserId || ""} 
      />
    </div>
  );
}
