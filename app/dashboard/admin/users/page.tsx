export const dynamic = "force-dynamic"; // Toujours important pour que les données soient fraîches

import { Suspense } from "react"; // <--- IMPORT IMPORTANT
import { getUsers, getAdminStats } from "@/app/actions/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { PaginationControl } from "@/components/ui/pagination-control";
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
import { Role } from "@prisma/client";
import { Loader2, UserPlus, Users as UsersIcon } from "lucide-react";
import { AdminStats } from "@/components/admin/AdminSats";
import { UserFilters } from "@/components/admin/UseFilter";

// Helper couleurs
const getRoleBadgeColor = (role: Role) => {
  switch (role) {
    case "ADMIN": return "destructive";
    case "LEADER": return "default";
    case "INTERCESSOR": return "secondary";
    case "PRAYER_LEADER": return "outline";
    default: return "outline"; 
  }
};

const formatRole = (role: string) => {
    switch (role) {
        case "PRAYER_LEADER": return "Conducteur";
        case "INTERCESSOR": return "Intercesseur";
        case "REQUESTER": return "Utilisateur";
        default: return role;
    }
};

type SearchParams = Promise<{ [key: string]: string | undefined }>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  
  const [usersRes, stats] = await Promise.all([
    getUsers({
        page: currentPage,
        limit: 10,
        search: params.search,
        role: params.role
    }),
    getAdminStats()
  ]);

  const users = usersRes.success && usersRes.data ? usersRes.data : [];
  const metadata = usersRes.success ? usersRes.metadata : null;

  return (
    <div className="flex-1 space-y-8 p-4 sm:p-8 pt-6 bg-gray-50/30 min-h-screen">
      {/* Navigation Administration */}
      <div className="flex items-center gap-2 border-b pb-4">
        <Link
          href="/dashboard/admin/users"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white shadow-sm"
        >
          <UsersIcon className="h-4 w-4" />
          Utilisateurs
        </Link>
        <Link
          href="/dashboard/leader/team"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-indigo-700 hover:bg-white transition-colors"
        >
          <UserPlus className="h-4 w-4 text-pink-600" />
          Demandes d&apos;adhésion & Équipe
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-serif font-bold tracking-tight text-indigo-900">Gestion des Utilisateurs</h2>
            <p className="text-muted-foreground text-sm">
                Consultez et gérez les membres ({metadata?.totalCount || 0} total).
            </p>
        </div>

        <Link href="/dashboard/leader/team">
          <Button variant="outline" className="gap-2 bg-white text-pink-700 border-pink-200 hover:bg-pink-50 shadow-sm">
            <UserPlus className="h-4 w-4 text-pink-600" />
            Voir les demandes d&apos;adhésion
          </Button>
        </Link>
      </div>

      <AdminStats stats={stats} />

      {/* --- CORRECTION : SUSPENSE POUR LES FILTRES --- */}
      <Suspense fallback={<div className="h-20 bg-white rounded-lg border animate-pulse" />}>
        <UserFilters />
      </Suspense>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Identité</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
                users.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50/50">
                    <TableCell>
                    <Avatar className="border border-gray-100">
                        <AvatarImage src={user.image || ""} />
                        <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold text-xs">
                            {user.name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                        <div className="flex flex-col">
                            <span className="text-gray-900">{user.name}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col text-xs text-muted-foreground gap-1">
                            <span>{user.email}</span>
                            {user.phone && <span className="text-gray-500">{user.phone}</span>}
                        </div>
                    </TableCell>
                    <TableCell>
                    <Badge 
                        variant={getRoleBadgeColor(user.role)}
                        className={user.role === "PRAYER_LEADER" ? "border-indigo-500 text-indigo-700 bg-indigo-50" : ""}
                    >
                        {formatRole(user.role)}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
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
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Aucun utilisateur trouvé.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- CORRECTION : SUSPENSE POUR LA PAGINATION --- */}
      {metadata && (
        <Suspense fallback={<div className="flex justify-end py-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400"/></div>}>
            <PaginationControl 
                totalPages={metadata.totalPages} 
                currentPage={metadata.currentPage} 
                className="justify-end"
            />
        </Suspense>
      )}
    </div>
  );
}