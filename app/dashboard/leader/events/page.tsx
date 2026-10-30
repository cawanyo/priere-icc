import { getSpecialEvents } from "@/app/actions/event";
import { EventList } from "@/components/dashboard/event/EventList";
import { Sparkles } from "lucide-react";

export default async function EventsPage() {
  const { data: events } = await getSpecialEvents();
  return (
    <div className="flex-1 space-y-6 p-5 md:p-8 pt-5 md:pt-6 bg-[#f8fafc] min-h-screen">
      <div className="flex items-center gap-3.5">
        <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            Événements Spéciaux
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Séminaires, jeûnes et programmes ponctuels.
          </p>
        </div>
      </div>

      <EventList events={events || []} />
    </div>
  );
}
