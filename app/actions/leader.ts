// app/actions/leader.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

// Vérification des droits (Leader ou Admin)
export async function checkLeaderAccess() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session || !session.user?.id) throw new Error("Non connecté");
  
  // @ts-ignore
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  
  if (!user || (user.role !== "LEADER" && user.role !== "ADMIN")) {
    throw new Error("Accès refusé. Réservé aux Leaders.");
  }
  return user;
}

export type PrayerFilters = {
  status?: string;
  type?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;  // Nouveau
  limit?: number; // Nouveau
};

export async function getGlobalPrayers(filters: PrayerFilters = {}) {
  try {
    await checkLeaderAccess();

    const page = filters.page || 1;
    const limit = filters.limit || 12; // 12 cartes par page pour le leader
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    // Filtres
    if (filters.status && filters.status !== "ALL") whereClause.status = filters.status;
    if (filters.type && filters.type !== "ALL") whereClause.subjectType = filters.type;
    if (filters.search) {
      whereClause.OR = [
        { name: { contains: filters.search } },
        { content: { contains: filters.search } },
      ];
    }
    if (filters.startDate) {
      whereClause.createdAt = { gte: new Date(filters.startDate) };
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    // 1. Compter le total pour la pagination
    const totalCount = await prisma.prayer.count({ where: whereClause });

    // 2. Récupérer les données paginées
    const prayers = await prisma.prayer.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, email: true, phone: true, image: true } }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return { 
        success: true, 
        data: prayers, 
        metadata: { totalPages, currentPage: page, totalCount } 
    };

  } catch (error) {
    return { success: false, error: "Erreur lors du chargement." };
  }
}

export async function updateGlobalPrayerStatus(prayerId: string, newStatus: string) {
  try {
    await checkLeaderAccess();

    await prisma.prayer.update({
      where: { id: prayerId },
      data: { status: newStatus },
    });

    revalidatePath("/dashboard/leader/prayer");
    return { success: true, message: "Statut mis à jour." };
  } catch (error) {
    return { success: false, message: "Erreur lors de la mise à jour." };
  }
}