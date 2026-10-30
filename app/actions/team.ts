// app/actions/team.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

async function checkLeaderAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Non connecté");

  const userId = (session.user as any).id;
  const userEmail = session.user.email;
  if (!userId && !userEmail) throw new Error("Non connecté");

  const user = await prisma.user.findFirst({
    where: userId ? { id: userId } : { email: userEmail! }
  });

  if (!user || (user.role !== "LEADER" && user.role !== "ADMIN")) {
    throw new Error("Accès refusé : réservé aux Leaders et Administrateurs.");
  }
  return user;
}

// --- GESTION DES MEMBRES ---

export async function getTeamMembers(availabilityCheck?: { start: Date; end: Date }) {
  try {
    await checkLeaderAccess();

    // Mettre à jour automatiquement les anciens comptes ayant le rôle par défaut REQUESTER en PRAYER_LEADER
    await prisma.user.updateMany({
      where: { role: "REQUESTER" },
      data: { role: "PRAYER_LEADER" }
    }).catch(() => {});

    const whereClause: any = { 
      role: { in: ["INTERCESSOR", "PRAYER_LEADER", "LEADER", "ADMIN", "REQUESTER"] } 
    };

    // Si on cherche des dispos pour un créneau précis
    if (availabilityCheck) {
      whereClause.unavailabilities = {
        none: {
          AND: [
            { startDate: { lt: availabilityCheck.end } },
            { endDate: { gt: availabilityCheck.start } }
          ]
        }
      };
    }

    const members = await prisma.user.findMany({
      where: whereClause,
      select: { 
        id: true, 
        name: true, 
        email: true, 
        phone: true, 
        image: true, 
        role: true, 
        createdAt: true 
      },
      orderBy: { name: "asc" }
    });

    return { success: true, data: members };
  } catch (error: any) {
    return { success: false, error: error?.message || "Erreur chargement équipe" };
  }
}

export async function removeTeamMember(userId: string) {
  try {
    await checkLeaderAccess();

    await prisma.user.update({
      where: { id: userId },
      data: { role: "PRAYER_LEADER" }
    });

    revalidatePath("/dashboard/leader/team");

    await createNotification(
      userId,
      "Mise à jour de votre profil",
      "Votre statut au sein de l'équipe a été mis à jour.",
      "INFO",
      "/dashboard/user/profile"
    );

    return { success: true, message: "Membre mis à jour." };
  } catch (error: any) {
    return { success: false, message: error?.message || "Erreur lors de la modification." };
  }
}
