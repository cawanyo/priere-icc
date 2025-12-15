// app/dashboard/leader/events/[id]/page.tsx

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getEventDetails } from "@/app/actions/event";
import { EventCalendar } from "@/components/dashboard/event/EventCalendar";

// Note: Pour Next.js 15, les params sont une Promise
export default async function EventPlanningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { event: specialEvent, success } = await getEventDetails(id);

  if (!success || !specialEvent) return <div>Événement introuvable</div>;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gray-50/30 min-h-screen">
      
      {/* En-tête de page amélioré */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="h-10 w-10">
                <Link href="/dashboard/leader/events"><ArrowLeft className="h-6 w-6" /></Link>
            </Button>
            <div>
                <h2 className="text-2xl font-serif font-bold text-indigo-900">{specialEvent.title}</h2>
                <p className="text-sm text-muted-foreground">Gestion du planning spécifique</p>
            </div>
        </div>

        {/* --- BOUTON D'EXPORT PDF --- */}
        {/* <div>
            <DownloadPlanningButton 
                events={specialEvent.plannings || []} // On passe tout le calendrier de l'événement
                title={specialEvent.title}
                subtitle="Programme Spécial"
                startDate={new Date(specialEvent.startDate)}
                endDate={new Date(specialEvent.endDate)}
                fileName={`programme-${specialEvent.title.toLowerCase().replace(/\s+/g, '-')}.pdf`}
            />
        </div> */}
      </div>

      {/* Le calendrier interactif */}
      <EventCalendar specialEvent={specialEvent} />
    </div>
  );
}