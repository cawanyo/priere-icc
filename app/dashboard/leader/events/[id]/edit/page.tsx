import { getEventForEdit } from "@/app/actions/event";
import { EventFormPage } from "@/components/dashboard/event/EventFormPage";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { event, success } = await getEventForEdit(id);

  if (!success || !event) {
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
    <div className="flex-1 p-4 sm:px-6 md:px-8 py-5 md:py-6 pb-28 md:pb-12 bg-[#f8fafc] min-h-screen">
      <EventFormPage eventToEdit={event as any} />
    </div>
  );
}
