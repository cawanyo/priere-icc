import { getIntercessorEventDetails } from "@/app/actions/intercessor";
import { IntercessorEventCalendar } from "@/components/dashboard/intercessor/events/IntercessorEventCalendar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function IntercessorEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { event, currentUserId, success } = await getIntercessorEventDetails(id);

  if (!success || !event) return <div>Événement introuvable</div>;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gray-50/30 min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/user/intercessor/events"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
            <h2 className="text-2xl font-serif font-bold text-indigo-900">{event.title}</h2>
            <p className="text-sm text-muted-foreground">Planning de l'événement</p>
        </div>
      </div>

      <IntercessorEventCalendar 
        event={event} 
        currentUserId={currentUserId || ""} 
      />
    </div>
  );
}