import { getFamilyDetails } from "@/app/actions/prayer-house";
import { getFamilyUnavailabilities } from "@/app/actions/prayer-house-planning";
import { AvailabilityList } from "@/components/dashboard/availability/AvailabilityList";
import { FamilyMemberManager } from "@/components/prayer-house/FamilyMemberManager";
import { NightPlanningBoard } from "@/components/prayer-house/NightPlanningBoard";
import { ChevronLeft, ShieldCheck, Moon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function FamilyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const { success, family, candidates } = await getFamilyDetails(id);
  const res = await getFamilyUnavailabilities(id, new Date());
  if (!success || !family) {
    return notFound();
  }

  return (
    <div className="flex-1 px-4 sm:px-6 md:px-8 py-5 md:py-6 pb-28 md:pb-12 space-y-6 bg-[#f8fafc] min-h-screen">
      {/* Navigation retour */}
      <div>
        <Link 
          href="/dashboard/leader/prayer-house" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors py-1 px-2 -ml-2 rounded-lg"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Toutes les maisons de prière</span>
        </Link>
      </div>

      {/* En-tête de la Famille */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0"
            style={{ backgroundColor: family.color || "#4f46e5" }}
          >
            {family.name[0]}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {family.name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {family.description || "Sentinelles de garde nocturne (00h00 - 04h00)"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-100 text-xs font-semibold text-slate-700 self-start md:self-auto">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>{family.users.length} sentinelle{family.users.length > 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Layout Principal : Membres & Planning */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Colonne Gauche : Gestion des Sentinelles & Indisponibilités */}
        <div className="lg:col-span-4 space-y-5 order-2 lg:order-1">
          <FamilyMemberManager 
            familyId={family.id} 
            members={family.users} 
            candidates={candidates || []} 
          />
          <AvailabilityList items={res.success ? res.data || [] : []} leaderMode />
        </div>

        {/* Colonne Droite : Planning Global */}
        <div className="lg:col-span-8 order-1 lg:order-2">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
              <Moon className="h-4 w-4 text-indigo-600" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Planning des Nuits
              </h2>
            </div>
            <div className="p-2 sm:p-4">
              <NightPlanningBoard unavailabilities={res.data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
