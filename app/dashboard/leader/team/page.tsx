'use client';

// app/dashboard/leader/team/page.tsx

import { getRoleRequests, getTeamMembers } from "@/app/actions/team";
import { RoleRequestList, RoleRequestItem } from "@/components/dashboard/team/RoleRequestList";
import { TeamMemberList } from "@/components/dashboard/team/TeamMemberList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import supabase from "@/lib/superbase";
import { Users, UserPlus, Crown, Mic2, RefreshCw, Search, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export default function TeamManagementPage() {
  const [requestsData, setRequestsData] = useState<{ success: boolean; data?: RoleRequestItem[]; error?: string } | null>(null);
  const [membersData, setMembersData] = useState<Awaited<ReturnType<typeof getTeamMembers>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqRes, memRes] = await Promise.all([
        getRoleRequests("ALL"),
        getTeamMembers(),
      ]);
      setRequestsData(reqRes);
      setMembersData(memRes);

      // Si des demandes en attente existent, cibler PENDING, sinon ALL
      if (reqRes?.success && Array.isArray(reqRes.data)) {
        const hasPending = reqRes.data.some((r) => r.status === "PENDING");
        setStatusFilter((prev) => (prev === "ALL" && hasPending ? "PENDING" : prev));
      }
    } catch (e) {
      console.error("Erreur chargement données:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const allRequests = useMemo<RoleRequestItem[]>(() => {
    return requestsData && requestsData.success && Array.isArray(requestsData.data) ? requestsData.data : [];
  }, [requestsData]);

  const allMembers = useMemo(() => {
    return membersData && membersData.success && Array.isArray(membersData.data) ? membersData.data : [];
  }, [membersData]);

  // Compteurs par statut
  const pendingCount = useMemo(() => allRequests.filter((r) => r.status === "PENDING").length, [allRequests]);
  const approvedCount = useMemo(() => allRequests.filter((r) => r.status === "APPROVED").length, [allRequests]);
  const rejectedCount = useMemo(() => allRequests.filter((r) => r.status === "REJECTED").length, [allRequests]);

  // Filtrage des demandes (par statut + recherche)
  const filteredRequests = useMemo(() => {
    return allRequests.filter((r) => {
      const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        r.user?.name?.toLowerCase().includes(query) ||
        r.user?.email?.toLowerCase().includes(query) ||
        r.user?.phone?.toLowerCase().includes(query);
      return matchStatus && matchSearch;
    });
  }, [allRequests, statusFilter, searchQuery]);

  // Répartition par rôle pour l'affichage
  const requestsIntercessors = useMemo(
    () => filteredRequests.filter((r) => r.role === "INTERCESSOR"),
    [filteredRequests]
  );
  const requestsLeaders = useMemo(
    () => filteredRequests.filter((r) => r.role === "PRAYER_LEADER"),
    [filteredRequests]
  );

  // Membres actuels
  const membersIntercessors = useMemo(
    () => allMembers.filter((m) => m.role === "INTERCESSOR"),
    [allMembers]
  );
  const membersLeaders = useMemo(
    () => allMembers.filter((m) => m.role === "PRAYER_LEADER"),
    [allMembers]
  );

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6 bg-gray-50/30 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold tracking-tight text-indigo-900">
            Gestion des Candidatures & Équipes
          </h2>
          <p className="text-muted-foreground text-sm">
            Recrutement, suivi des demandes d&apos;adhésion et supervision des membres.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto gap-2 bg-white shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          <span>Actualiser</span>
        </Button>
      </div>

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="bg-white border w-full sm:w-auto grid grid-cols-2 sm:inline-flex p-1 rounded-xl shadow-sm">
          <TabsTrigger
            value="requests"
            className="data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700 rounded-lg text-sm font-medium"
          >
            <UserPlus className="h-4 w-4 mr-2" /> Candidatures
            {allRequests.length > 0 && (
              <span className="ml-2 bg-pink-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingCount > 0 ? `${pendingCount} en attente` : allRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-lg text-sm font-medium"
          >
            <Users className="h-4 w-4 mr-2" /> Membres actifs
            {allMembers.length > 0 && (
              <span className="ml-2 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {allMembers.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* --- ONGLET CANDIDATURES --- */}
        <TabsContent value="requests" className="space-y-6 animate-in fade-in-50">
          {/* Barre de filtres et recherche */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Filtres par statut */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                size="sm"
                variant={statusFilter === "ALL" ? "default" : "ghost"}
                onClick={() => setStatusFilter("ALL")}
                className={`h-8 text-xs rounded-lg ${
                  statusFilter === "ALL"
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Toutes ({allRequests.length})
              </Button>

              <Button
                size="sm"
                variant={statusFilter === "PENDING" ? "default" : "ghost"}
                onClick={() => setStatusFilter("PENDING")}
                className={`h-8 text-xs rounded-lg ${
                  statusFilter === "PENDING"
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "text-amber-700 hover:bg-amber-50"
                }`}
              >
                <Clock className="h-3 w-3 mr-1" />
                En attente ({pendingCount})
              </Button>

              <Button
                size="sm"
                variant={statusFilter === "APPROVED" ? "default" : "ghost"}
                onClick={() => setStatusFilter("APPROVED")}
                className={`h-8 text-xs rounded-lg ${
                  statusFilter === "APPROVED"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Validées ({approvedCount})
              </Button>

              <Button
                size="sm"
                variant={statusFilter === "REJECTED" ? "default" : "ghost"}
                onClick={() => setStatusFilter("REJECTED")}
                className={`h-8 text-xs rounded-lg ${
                  statusFilter === "REJECTED"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "text-red-700 hover:bg-red-50"
                }`}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Refusées ({rejectedCount})
              </Button>
            </div>

            {/* Barre de recherche */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs rounded-lg border-gray-200"
              />
            </div>
          </div>

          {/* Section Intercesseurs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-pink-600 flex items-center gap-2">
                <Crown className="h-4 w-4" /> Candidatures Intercesseurs ({requestsIntercessors.length})
              </h3>
            </div>
            <RoleRequestList requests={requestsIntercessors} onUpdated={loadData} />
          </div>

          {/* Section Conducteurs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-2">
                <Mic2 className="h-4 w-4" /> Candidatures Conducteurs ({requestsLeaders.length})
              </h3>
            </div>
            <RoleRequestList requests={requestsLeaders} onUpdated={loadData} />
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
              <span className="text-xs font-medium bg-pink-100 text-pink-700 px-2.5 py-1 rounded-full">
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
              <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
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
