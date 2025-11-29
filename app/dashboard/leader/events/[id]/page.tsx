import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getEventDetails } from "@/app/actions/event";
import { EventCalendar } from "@/components/dashboard/event/EventCalendar";

export default async function EventPlanningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Await pour Next 15
  const { event, calendar, success } = await getEventDetails(id);

  if (!success || !event) return <div>Événement introuvable</div>;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gray-50/30 min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/leader/events"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
            <h2 className="text-2xl font-serif font-bold text-indigo-900">{event.title}</h2>
            <p className="text-sm text-muted-foreground">Planning spécifique du programme</p>
        </div>
      </div>

      <EventCalendar event={event} calendarData={calendar || []} />
    </div>
  );
}