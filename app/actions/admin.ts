// app/actions/admin.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";
import { sendSMS } from "@/lib/sms";


// Vérification de sécurité
export async function checkAdmin() {
  const session = await getServerSession(authOptions);

  // 1. Vérifier si une session existe et possède un ID utilisateur
  // @ts-ignore
  if (!session || !session.user || !session.user.id) {
    throw new Error("Non authentifié");
  }

  // 2. Aller chercher l'utilisateur "frais" dans la base de données
  // @ts-ignore
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  // 3. Vérifier le rôle directement depuis la base de données
  if (!user || user.role !== "ADMIN") {
    throw new Error("Accès non autorisé : Vous n'avez pas les droits d'administrateur.");
  }

  return user;
}

export async function deleteUser(userId: string) {
  await checkAdmin();
  try {
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath("/dashboard/admin/users");
    return { success: true, message: "Utilisateur supprimé" };
  } catch (error) {
    return { success: false, message: "Erreur lors de la suppression" };
  }
}

export async function updateUserRole(userId: string, newRole: Role) {
  await checkAdmin();
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });


    if(user){
      await createNotification(
        userId,
        "Mise à jour Profil",
        `Vous avez maintenant le profil ${newRole} sur la plateforme du MDPI`,
        "INFO",
        "/dashboard/user/profile"
      );
      // Optionnel : Notifier le refus
      if(user.phone)
        await sendSMS(user.phone, `Bonjour ${user.name}, Vous avez maintenant le profil ${newRole} sur la plateforme du MDPI.`);
    }

    revalidatePath("/dashboard/admin/users");
    return { success: true, message: "Rôle mis à jour" };
  } catch (error) {
    return { success: false, message: "Erreur lors de la mise à jour" };
  }
}

export async function getAdminStats() {
  await checkAdmin();
  const totalUsers = await prisma.user.count();
  const intercessors = await prisma.user.count({ where: { role: "INTERCESSOR" } });
  const admins = await prisma.user.count({ where: { role: "ADMIN" } });
  const requesters = await prisma.user.count({ where: { role: "REQUESTER" } });

  return { totalUsers, intercessors, admins, requesters };
}

// app/actions/admin.ts
// ... (checkAdmin, deleteUser, updateUserRole, getAdminStats restent inchangés) ...

// --- NOUVELLE FONCTION : Récupération des utilisateurs ---

export type UserFilters = {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
};

export async function getUsers(options: UserFilters = {}) {
  await checkAdmin();
  try {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // 1. Recherche (Nom ou Email)
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { email: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    // 2. Filtre par Rôle
    if (options.role && options.role !== "ALL") {
      where.role = options.role as Role;
    }

    // Exécution en parallèle (Données + Compte total)
    const [users, totalCount] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, role: true, phone: true, image: true, createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    return { 
        success: true, 
        data: users, 
        metadata: { totalPages, currentPage: page, totalCount } 
    };

  } catch (error) {
    return { success: false, error: "Erreur lors du chargement des utilisateurs." };
  }
}


