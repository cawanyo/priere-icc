"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export type PrayerFilters = {
  status?: string;
  type?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  dateOrder?: 'asc' | 'desc';
  page?: number;  // Nouveau
  limit?: number; // Nouveau
};

export async function getUserPrayers(filters: PrayerFilters = {}) {
  const session = await getServerSession(authOptions);
  
  // @ts-ignore
  if (!session || !session.user?.id) throw new Error("Vous devez être connecté");

  const page = filters.page || 1;
  const limit = filters.limit || 9; // 9 cartes par page par défaut
  const skip = (page - 1) * limit;

  const whereClause: any = {
    // @ts-ignore
    userId: session.user.id,
  };

  if (filters.status && filters.status !== "ALL") whereClause.status = filters.status;
  if (filters.type && filters.type !== "ALL") whereClause.subjectType = filters.type;
  if (filters.search) {
    whereClause.OR = [
      { content: { contains: filters.search } },
      { subjectType: { contains: filters.search } }
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

  try {
    // 1. Récupérer le total pour calculer les pages
    const totalCount = await prisma.prayer.count({ where: whereClause });

    // 2. Récupérer les données paginées
    const prayers = await prisma.prayer.findMany({
      where: whereClause,
      orderBy: { createdAt: filters.dateOrder || 'desc' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return { success: true, data: prayers, metadata: { totalPages, currentPage: page, totalCount } };
  } catch (error) {
    return { success: false, error: "Impossible de récupérer les prières" };
  }
}



export async function updatePrayerStatus(prayerId: string, newStatus: string) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session || !session.user?.id) throw new Error("Non autorisé");

  try {
    const prayer = await prisma.prayer.findUnique({
        where: { id: prayerId },
    });

    // @ts-ignore
    if (!prayer || prayer.userId !== session.user.id) {
        throw new Error("Prière introuvable ou non autorisée");
    }

    await prisma.prayer.update({
      where: { id: prayerId },
      data: { status: newStatus },
    });

    revalidatePath("/dashboard/user/prayer");
    return { success: true, message: "Statut mis à jour" };
  } catch (error) {
    return { success: false, message: "Erreur lors de la mise à jour" };
  }
}