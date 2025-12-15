import { getPrayerFamilies } from "@/app/actions/prayer-house";
import { FamilyList } from "@/components/prayer-house/FamilyList";
import { NightPlanningBoard } from "@/components/prayer-house/NightPlanningBoard";

import { Home } from "lucide-react";

export default async function PrayerHousePage() {
  const { data: families } = await getPrayerFamilies();

  return (
    <div className="flex-1 p-8 pt-6 space-y-8 bg-gray-50/30 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold tracking-tight text-indigo-900 flex items-center gap-3">
            <Home className="h-8 w-8 text-pink-600" />
            Maison de Prière
          </h2>
          <p className="text-muted-foreground">
            Gérez les familles et le planning des sentinelles (00h-04h).
          </p>
        </div>
      </div>

      {/* 1. Liste des Familles */}
      <section>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Les Familles</h3>
        <FamilyList initialFamilies={families || []} />
      </section>

      {/* 2. Planning de Nuit */}
      <section className="pt-6 border-t">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
             🌙 Planning des Sentinelles
             <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">00h - 04h</span>
        </h3>
        <NightPlanningBoard />
      </section>
    </div>
  );
}