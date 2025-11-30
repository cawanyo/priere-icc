// app/dashboard/admin/users/page.tsx
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserActions } from "@/components/admin/UserActions";
import { getAdminStats } from "@/app/actions/admin";
import { Role } from "@prisma/client";
import { AdminStats } from "@/components/admin/AdminSats";

// Helper pour les couleurs des badges
const getRoleBadgeColor = (role: Role) => {
  switch (role) {
    case "ADMIN": return "destructive"; // Rouge
    case "LEADER": return "default"; // Noir/Blanc
    case "INTERCESSOR": return "secondary"; // Gris/Bleu
    default: return "outline"; // Bordure simple
  }
};

export default async function AdminUsersPage() {
  // 1. Récupération des données (Parallélisée pour la performance)
  const [users, stats] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        image: true,
        createdAt: true,
      }
    }),
    getAdminStats()
  ]);

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h2>
      </div>

      {/* Section Statistiques */}
      <AdminStats stats={stats} />

      {/* Section Tableau */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Identité</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Date d'inscription</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Avatar>
                    <AvatarImage src={user.image || ""} />
                    <AvatarFallback>{user.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">
                    <div className="flex flex-col">
                        <span>{user.name}</span>
                        {/* Affiche "Moi" si c'est l'utilisateur courant, optionnel */}
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex flex-col text-sm text-muted-foreground">
                        <span>{user.email}</span>
                        <span>{user.phone || "-"}</span>
                    </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeColor(user.role)}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                    {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell className="text-right">
                  <UserActions 
                    userId={user.id} 
                    currentRole={user.role} 
                    userName={user.name || "Utilisateur"} 
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}