'use client';

import { getTeamMembers } from "@/app/actions/team";
import { TeamMemberList } from "@/components/dashboard/team/TeamMemberList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, RefreshCw, Search, Crown, Mic2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type RoleFilter = "ALL" | "PRAYER_LEADER" | "INTERCESSOR" | "LEADER";

export default function TeamManagementPage() {
  const [membersData, setMembersData] = useState<Awaited<ReturnType<typeof getTeamMembers>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const memRes = await getTeamMembers();
      setMembersData(memRes);
    } catch (e) {
      console.error("Erreur chargement données:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const allMembers = useMemo(() => {
    return membersData && membersData.success && Array.isArray(membersData.data) ? membersData.data : [];
  }, [membersData]);

  const filteredMembers = useMemo(() => {
    return allMembers.filter((m) => {
      const matchRole = roleFilter === "ALL" || m.role === roleFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        m.name?.toLowerCase().includes(query) ||
        m.email?.toLowerCase().includes(query) ||
        m.phone?.toLowerCase().includes(query);
      return matchRole && matchSearch;
    });
  }, [allMembers, roleFilter, searchQuery]);

  const prayerLeadersCount = useMemo(() => allMembers.filter((m) => m.role === "PRAYER_LEADER").length, [allMembers]);
  const leadersCount = useMemo(() => allMembers.filter((m) => m.role === "LEADER" || m.role === "ADMIN").length, [allMembers]);

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-8 pt-5 sm:pt-6 bg-[#f8fafc] min-h-screen">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Membres de l&apos;Équipe
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervision des conducteurs de prière et de l&apos;équipe.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto gap-2 bg-white rounded-xl border-slate-200 shadow-xs text-xs"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 text-indigo-600", loading && "animate-spin")} />
          <span>Actualiser</span>
        </Button>
      </div>

      {/* Barre de filtres et recherche */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filtres par rôle */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setRoleFilter("ALL")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer",
              roleFilter === "ALL"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            )}
          >
            Tous ({allMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("PRAYER_LEADER")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5",
              roleFilter === "PRAYER_LEADER"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            )}
          >
            <Mic2 className="h-3 w-3" />
            Conducteurs ({prayerLeadersCount})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("LEADER")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5",
              roleFilter === "LEADER"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            )}
          >
            <Crown className="h-3 w-3" />
            Responsables ({leadersCount})
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher un membre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      {/* Liste des membres */}
      <TeamMemberList members={filteredMembers} />
    </div>
  );
}
