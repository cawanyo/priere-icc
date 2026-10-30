import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, Calendar } from "lucide-react";
import { getEventDetails } from "@/app/actions/event";
import { EventCalendar } from "@/components/dashboard/event/EventCalendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function EventPlanningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { event: specialEvent, success } = await getEventDetails(id);

  if (!success || !specialEvent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-3">
        <p className="text-base font-semibold text-slate-700">Événement introuvable.</p>
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link href="/dashboard/leader/events">Retour aux événements</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 px-4 sm:px-6 md:px-8 py-5 md:py-6 pb-28 md:pb-12 bg-[#f8fafc] min-h-screen">
      <div>
        <Link 
          href="/dashboard/leader/events" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors py-1 px-2 -ml-2 rounded-lg"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Gestion des événements</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">{specialEvent.title}</h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-indigo-600" />
            Du {format(new Date(specialEvent.startDate), "d MMMM", { locale: fr })} au {format(new Date(specialEvent.endDate), "d MMMM yyyy", { locale: fr })}
          </p>
        </div>
      </div>

      <EventCalendar specialEvent={specialEvent} />
    </div>
  );
}
