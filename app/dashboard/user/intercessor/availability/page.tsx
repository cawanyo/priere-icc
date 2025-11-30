// app/dashboard/user/intercessor/availability/page.tsx
import { getUserUnavailabilities } from "@/app/actions/availability";
import { AvailabilityForm } from "@/components/dashboard/availability/AvailabilityForm";
import { AvailabilityList } from "@/components/dashboard/availability/AvailabilityList";
import { CalendarClock } from "lucide-react";


export default async function AvailabilityPage() {
  const { data: items } = await getUserUnavailabilities();

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-gray-50/30 min-h-screen">
      
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 shadow-sm">
            <CalendarClock className="h-6 w-6" />
        </div>
        <div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-indigo-900">
                Mes Disponibilités
            </h2>
            <p className="text-muted-foreground">
                Signalez vos absences pour aider les leaders à organiser le planning de prière.
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Colonne Gauche : Formulaire (4/12) */}
        <div className="lg:col-span-5 xl:col-span-4">
            <AvailabilityForm />
        </div>

        {/* Colonne Droite : Liste (8/12) */}
        <div className="lg:col-span-7 xl:col-span-8">
            <AvailabilityList items={items || []} />
        </div>
      </div>
    </div>
  );
}