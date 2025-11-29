import { getIntercessorSpecialEvents } from "@/app/actions/intercessor";
import { IntercessorEventList } from "@/components/dashboard/intercessor/events/IntercessorEventList";
import { CalendarRange } from "lucide-react";

export default async function IntercessorEventsPage() {
  const { data: events } = await getIntercessorSpecialEvents();

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-gray-50/30 min-h-screen">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <CalendarRange className="h-6 w-6" />
        </div>
        <div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-indigo-900">
                Programmes Spéciaux
            </h2>
            <p className="text-muted-foreground">
                Consultez les temps forts à venir et votre implication.
            </p>
        </div>
      </div>

      <IntercessorEventList events={events || []} />
    </div>
  );
}