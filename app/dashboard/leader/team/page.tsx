'use client'
// app/dashboard/leader/team/page.tsx

import { getRoleRequests, getTeamMembers } from "@/app/actions/team";
import { RoleRequestList } from "@/components/dashboard/team/RoleRequestList";
import { TeamMemberList } from "@/components/dashboard/team/TeamMemberList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import supabase from "@/lib/superbase";
import { request } from "http";
import { Users, UserPlus, Crown, Mic2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function TeamManagementPage() {
  const [requestsData, setRequstsDate] = useState<any>()
  const [membersData, setMembersData] = useState<any>()
  const loadData = async () => {
    const [requestData, membersData] = await Promise.all([
      getRoleRequests(),
      getTeamMembers(),
    ]);
    setRequstsDate(requestData);
    setMembersData(membersData);
  }
  

  useEffect(() => {
    loadData();
  }, [])
  

  useEffect(() => {
    const channel = supabase.channel('admin-dashboard');

    channel
      .on('broadcast', { event: 'new-request' }, () => {
         console.log("Nouvelle demande reçue !");
         loadData();
      })
      .on('broadcast', { event: 'request-handled' }, () => {
        console.log("✅ Une demande a été traitée ailleurs !");
        loadData();
     })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const allRequests = requestsData && requestsData.success  ? requestsData.data ?? [] : [];
  const allMembers = membersData && membersData.success ? membersData.data ?? []: [];

  // FILTRAGE DES DONNÉES PAR RÔLE
  // 1. Candidatures
  const requestsIntercessors = allRequests.filter((r: any) => r.role === "INTERCESSOR");
  const requestsLeaders = allRequests.filter((r: any) => r.role === "PRAYER_LEADER");

  // 2. Membres
  const membersIntercessors = allMembers.filter((m: any) => m.role === "INTERCESSOR");
  const membersLeaders = allMembers.filter((m: any) => m.role === "PRAYER_LEADER");

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-gray-50/30 min-h-screen">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight text-indigo-900">
          Gestion des Équipes
        </h2>
        <p className="text-muted-foreground">
          Recrutement et supervision des Intercesseurs et Conducteurs.
        </p>
      </div>

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="bg-white border w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
          <TabsTrigger value="requests" className="data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700">
            <UserPlus className="h-4 w-4 mr-2" /> Candidatures
            {(allRequests.length > 0) && (
                <span className="ml-2 bg-pink-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{allRequests.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
            <Users className="h-4 w-4 mr-2" /> Membres
          </TabsTrigger>
        </TabsList>

        {/* --- ONGLET CANDIDATURES --- */}
        <TabsContent value="requests" className="space-y-8 animate-in fade-in-50">
            
            {/* Section Intercesseurs */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-pink-600 flex items-center gap-2">
                    <Crown className="h-4 w-4" /> Intercesseurs en attente ({requestsIntercessors.length})
                </h3>
                <RoleRequestList requests={requestsIntercessors} />
            </div>

            {/* Section Conducteurs */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-2">
                    <Mic2 className="h-4 w-4" /> Conducteurs en attente ({requestsLeaders.length})
                </h3>
                <RoleRequestList requests={requestsLeaders} />
            </div>
        </TabsContent>

        {/* --- ONGLET MEMBRES --- */}
        <TabsContent value="members" className="space-y-8 animate-in fade-in-50">
            
            {/* Section Intercesseurs */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Crown className="h-5 w-5 text-pink-500" /> Équipe Intercession
                    </h3>
                    <span className="text-xs font-medium bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                        {membersIntercessors.length} membres
                    </span>
                </div>
                <TeamMemberList members={membersIntercessors} />
            </div>

            {/* Section Conducteurs */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Mic2 className="h-5 w-5 text-indigo-500" /> Équipe Conducteurs
                    </h3>
                    <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                        {membersLeaders.length} membres
                    </span>
                </div>
                <TeamMemberList members={membersLeaders} />
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}