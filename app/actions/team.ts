// app/actions/team.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

async function checkLeaderAccess() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session || !session.user?.id) throw new Error("Non connecté");
  // @ts-ignore
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || (user.role !== "LEADER" && user.role !== "ADMIN")) {
    throw new Error("Accès refusé.");
  }
  return user;
}

// --- GESTION DES CANDIDATURES ---

export async function getRoleRequests() {
  await checkLeaderAccess();
  try {
    const requests = await prisma.roleRequest.findMany({
      where: { status: "PENDING" }, // On récupère toutes les demandes en attente
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, image: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return { success: true, data: requests };
  } catch (error) {
    return { success: false, error: "Erreur chargement demandes" };
  }
}

export async function updateRoleRequestStatus(requestId: string, newStatus: string) {
  await checkLeaderAccess();
  try {
    // 1. Récupérer la demande pour connaître le rôle visé
    const request = await prisma.roleRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error("Demande introuvable");

    // 2. Mise à jour du statut de la demande
    await prisma.roleRequest.update({
      where: { id: requestId },
      data: { status: newStatus },
    });

    // 3. Si "APPROVED", on promeut l'utilisateur avec le rôle qu'il a demandé
    if (newStatus === "APPROVED") {
      await prisma.user.update({
        where: { id: request.userId },
        data: { role: request.role } // INTERCESSOR ou PRAYER_LEADER
      });
    }

    revalidatePath("/dashboard/leader/team");
    return { success: true, message: "Statut mis à jour." };
  } catch (error) {
    return { success: false, message: "Erreur opération." };
  }
}

// --- GESTION DES MEMBRES ---

export async function getTeamMembers() {
  await checkLeaderAccess();
  try {
    // On récupère les deux types de membres
    const members = await prisma.user.findMany({
      where: { 
        role: { in: ["INTERCESSOR", "PRAYER_LEADER"] } 
      },
      select: { id: true, name: true, email: true, phone: true, image: true, role: true, createdAt: true },
      orderBy: { name: "asc" }
    });
    return { success: true, data: members };
  } catch (error) {
    return { success: false, error: "Erreur chargement équipe" };
  }
}

export async function removeTeamMember(userId: string) {
  await checkLeaderAccess();
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: "REQUESTER" } // Retour case départ
    });
    
    // Nettoyage de l'ancienne demande
    await prisma.roleRequest.deleteMany({ where: { userId: userId } });

    revalidatePath("/dashboard/leader/team");
    return { success: true, message: "Membre retiré." };
  } catch (error) {
    return { success: false, message: "Erreur lors du retrait." };
  }
}