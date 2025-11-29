// app/dashboard/leader/team/page.tsx
import { getRoleRequests, getTeamMembers } from "@/app/actions/team";
import { RoleRequestList } from "@/components/dashboard/team/RoleRequestList";
import { TeamMemberList } from "@/components/dashboard/team/TeamMemberList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus } from "lucide-react";

export default async function TeamManagementPage() {
  // Récupération des données en parallèle
  const [requestsData, membersData] = await Promise.all([
    getRoleRequests(),
    getTeamMembers(),
  ]);

  const requests = requestsData.success ? requestsData.data : [];
  const members = membersData.success ? membersData.data : [];

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 bg-gray-50/30 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold tracking-tight text-indigo-900">
            Gestion de l'Équipe
          </h2>
          <p className="text-muted-foreground">
            Gérez les intercesseurs et validez les nouvelles recrues.
          </p>
        </div>
      </div>

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="bg-white border">
          <TabsTrigger value="requests" className="data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Candidatures
            {requests && requests.length > 0 && (
                <span className="ml-2 bg-pink-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {requests.length}
                </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
            <Users className="h-4 w-4 mr-2" />
            Membres Actuels
            <span className="ml-2 text-xs text-muted-foreground">({members?.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="animate-in fade-in-50">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Demandes en attente</h3>
                <p className="text-sm text-muted-foreground">Examinez les profils qui souhaitent rejoindre le ministère.</p>
            </div>
            <RoleRequestList requests={requests || []} />
        </TabsContent>

        <TabsContent value="members" className="animate-in fade-in-50">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Intercesseurs Actifs</h3>
                <p className="text-sm text-muted-foreground">Liste complète des membres de l'équipe.</p>
            </div>
            <TeamMemberList members={members || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}