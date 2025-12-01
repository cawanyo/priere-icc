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

import { getAdminStats } from "@/app/actions/admin";
import { Role } from "@prisma/client";
import { AdminStats } from "@/components/admin/AdminSats";
import { UserActions } from "@/components/admin/UserActions";

// Mise à jour des couleurs de badge
const getRoleBadgeColor = (role: Role) => {
  switch (role) {
    case "ADMIN": return "destructive"; // Rouge
    case "LEADER": return "default"; // Noir/Blanc
    case "INTERCESSOR": return "secondary"; // Gris/Bleu (Shadcn default secondary)
    case "PRAYER_LEADER": return "outline"; // Indigo (On le stylisera via className si besoin, ou outline par défaut)
    default: return "outline"; 
  }
};

// Fonction helper pour afficher un label plus joli
const formatRole = (role: string) => {
    switch (role) {
        case "PRAYER_LEADER": return "Conducteur";
        case "INTERCESSOR": return "Intercesseur";
        case "REQUESTER": return "Utilisateur";
        default: return role; // ADMIN, LEADER
    }
};

export default async function AdminUsersPage() {
  // ... (Code existant inchangé pour la récupération des données)
  const [users, stats] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, role: true, phone: true, image: true, createdAt: true,
      }
    }),
    getAdminStats()
  ]);

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h2>
      </div>

      <AdminStats stats={stats} />

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
                    <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold">
                        {user.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">
                    <div className="flex flex-col">
                        <span>{user.name}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex flex-col text-sm text-muted-foreground">
                        <span>{user.email}</span>
                        <span>{user.phone || "-"}</span>
                    </div>
                </TableCell>
                <TableCell>
                  {/* Utilisation d'une classe spécifique pour PRAYER_LEADER pour bien le distinguer */}
                  <Badge 
                    variant={getRoleBadgeColor(user.role)}
                    className={user.role === "PRAYER_LEADER" ? "border-indigo-500 text-indigo-700 bg-indigo-50" : ""}
                  >
                    {formatRole(user.role)}
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