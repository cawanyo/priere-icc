import { getFamilyDetails } from "@/app/actions/prayer-house";
import { FamilyMemberManager } from "@/components/prayer-house/FamilyMemberManager";
import { NightPlanningBoard } from "@/components/prayer-house/NightPlanningBoard";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function FamilyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const { success, family, candidates } = await getFamilyDetails(id);
  console.log(candidates);
  if (!success || !family) {
    return notFound();
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 space-y-6 bg-gray-50/30 min-h-screen">
      
      {/* En-tête avec Navigation et Titre */}
      <div className="flex flex-col gap-4 mb-2">
        <Link href="/dashboard/leader/prayer-house" className="text-sm text-gray-500 hover:text-indigo-600 flex items-center w-fit transition-colors">
            <ChevronLeft className="h-4 w-4 mr-1" /> Retour aux maisons
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
            <div>
                <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-indigo-900 flex items-center gap-3">
                    <span className="w-4 h-8 rounded-full shadow-sm" style={{ backgroundColor: family.color }}></span>
                    {family.name}
                </h2>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                    {family.description || "Espace de gestion de la famille et du planning."}
                </p>
            </div>
            
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border shadow-sm text-sm text-gray-600">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span>{family.members.length} Sentinelles actives</span>
            </div>
        </div>
      </div>

      {/* --- LAYOUT PRINCIPAL --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLONNE GAUCHE : Membres (1/3 sur grand écran) */}
        <div className="lg:col-span-4 order-2 lg:order-1">
            <FamilyMemberManager 
                familyId={family.id} 
                members={family.members} 
                candidates={candidates || []} 
            />
        </div>

        {/* COLONNE DROITE : Calendrier (2/3 sur grand écran) */}
        <div className="lg:col-span-8 order-1 lg:order-2">
             <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gray-50/50 flex items-center gap-2">
                    <span className="text-lg">🌙</span>
                    <h3 className="font-bold text-gray-800">Planning Global des Nuits</h3>
                </div>
                {/* Le calendrier s'adapte à la largeur du conteneur (2/3 de l'écran) */}
                <div className="p-1">
                    <NightPlanningBoard />
                </div>
             </div>
        </div>

      </div>
    </div>
  );
}