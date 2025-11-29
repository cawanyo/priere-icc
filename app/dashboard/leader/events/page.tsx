import { getSpecialEvents } from "@/app/actions/event";
import { EventList } from "@/components/dashboard/event/EventList";


export default async function EventsPage() {
  const { data: events } = await getSpecialEvents();

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-gray-50/30 min-h-screen">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight text-indigo-900">
          Événements Spéciaux
        </h2>
        <p className="text-muted-foreground">
          Séminaires, Jeûnes et Programmes ponctuels.
        </p>
      </div>
      <EventList events={events || []} />
    </div>
  );
}