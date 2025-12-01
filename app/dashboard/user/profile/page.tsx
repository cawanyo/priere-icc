// app/dashboard/user/profile/page.tsx
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { UserCog } from "lucide-react";


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SecurityForm } from "@/components/profile/SecurityForm";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { IntercessorJourney } from "@/components/profile/IntercessorRoad";
import { getUserWithRoleRequest } from "@/app/actions/role-request";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  // @ts-ignore
  if (!session || !session.user?.id) {
    redirect("/login");
  }

  // Récupérer utilisateur + sa demande de rôle (relation roleRequest)
  // @ts-ignore
  
  const user = await getUserWithRoleRequest();
  if (!user) return null;

  const hasPassword = !!user.password;
  const isIntercessorOrLeader = user.role === "INTERCESSOR" || user.role === "LEADER" || user.role === "ADMIN";

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* En-tête */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <UserCog className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-indigo-900">
              Mon Espace Personnel
            </h2>
            <p className="text-muted-foreground">
              Gérez vos informations et votre engagement.
            </p>
          </div>
        </div>

        {/* Contenu */}
        <Tabs defaultValue="general" className="space-y-6">
          
          <TabsList className="grid w-full grid-cols-2 lg:w-[600px] lg:grid-cols-3">
            <TabsTrigger value="general">Informations</TabsTrigger>
            {hasPassword && <TabsTrigger value="security">Sécurité</TabsTrigger>}
            {/* Onglet Ministère : visible pour tout le monde */}
            <TabsTrigger value="ministry">Ministère</TabsTrigger>
          </TabsList>

          {/* ONGLET GÉNÉRAL */}
          <TabsContent value="general" className="animate-in fade-in-50 duration-500">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Profil Utilisateur</CardTitle>
                <CardDescription>
                  Vos coordonnées sont utilisées pour pré-remplir vos demandes de prière.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm user={user} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ONGLET SÉCURITÉ */}
          {hasPassword && (
            <TabsContent value="security" className="animate-in fade-in-50 duration-500">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle>Mot de passe</CardTitle>
                  <CardDescription>
                    Mettez à jour votre mot de passe régulièrement.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SecurityForm />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* ONGLET MINISTÈRE (NOUVEAU) */}
          <TabsContent value="ministry" className="animate-in fade-in-50 duration-500">
            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle>Engagement Spirituel</CardTitle>
                    <CardDescription>
                        {isIntercessorOrLeader 
                            ? "Votre statut actuel au sein du ministère." 
                            : "Vous souhaitez vous engager davantage ? Suivez votre processus ici."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <IntercessorJourney 
                        userRole={user.role} 
                        requestStatus={user.roleRequest?.status || null} 
                        requestedRole={user.roleRequest?.role}
                    />
                </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}