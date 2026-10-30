import { getPrayerFamilies } from "@/app/actions/prayer-house";
import { FamilyList } from "@/components/prayer-house/FamilyList";
import { NightPlanningBoard } from "@/components/prayer-house/NightPlanningBoard";
import { Moon, Users, Clock } from "lucide-react";

export default async function PrayerHousePage() {
  const { data: families } = await getPrayerFamilies();

  return (
    <div className="flex-1 px-4 sm:px-6 md:px-8 py-5 md:py-6 pb-28 md:pb-12 space-y-7 bg-[#f8fafc] min-h-screen">
      {/* En-tête sobre */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Moon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Maison de Prière
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervision des sentinelles et des gardes nocturnes (00h - 04h).
            </p>
          </div>
        </div>
      </div>

      {/* 1. Liste des Familles de Prière */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-600" />
            Maisons & Équipes
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {families?.length || 0} famille{families && families.length > 1 ? "s" : ""}
          </span>
        </div>
        <FamilyList initialFamilies={families || []} />
      </section>

      {/* 2. Planning des Nuits */}
      <section className="space-y-3 pt-4 border-t border-slate-200/80">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-600" />
            Planning des Nuits
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
            00h00 - 04h00
          </span>
        </div>
        <NightPlanningBoard />
      </section>
    </div>
  );
}
