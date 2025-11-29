// app/actions/prayer.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

// Type mis à jour pour correspondre au composant PrayerFilters
export type PrayerFilters = {
  status?: string;
  type?: string;
  search?: string;      // Nouveau
  startDate?: string;   // Nouveau
  endDate?: string;     // Nouveau
  dateOrder?: 'asc' | 'desc';
};

export async function getUserPrayers(filters: PrayerFilters = {}) {
  const session = await getServerSession(authOptions);
  
  // @ts-ignore
  if (!session || !session.user?.id) {
    throw new Error("Vous devez être connecté");
  }

  // Base de la requête : l'utilisateur courant uniquement
  const whereClause: any = {
    // @ts-ignore
    userId: session.user.id,
  };

  // 1. Filtre Statut
  if (filters.status && filters.status !== "ALL") {
    whereClause.status = filters.status;
  }

  // 2. Filtre Type
  if (filters.type && filters.type !== "ALL") {
    whereClause.subjectType = filters.type;
  }

  // 3. Recherche (Contenu ou Type)
  if (filters.search) {
    whereClause.OR = [
      { content: { contains: filters.search } },
      { subjectType: { contains: filters.search } }
    ];
  }

  // 4. Filtre Date (Période)
  if (filters.startDate) {
    whereClause.createdAt = {
        gte: new Date(filters.startDate)
    };
    
    if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999); // Fin de journée
        whereClause.createdAt.lte = end;
    }
  }

  try {
    const prayers = await prisma.prayer.findMany({
      where: whereClause,
      orderBy: {
        createdAt: filters.dateOrder || 'desc',
      },
    });
    return { success: true, data: prayers };
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