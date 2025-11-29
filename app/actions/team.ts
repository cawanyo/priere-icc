// app/actions/team.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

// Vérification droits Leader/Admin
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
      // On récupère toutes les demandes qui ne sont pas encore finalisées en rôle
      where: {
        status: { not: "INTERCESSOR" } 
      },
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
    // 1. Mettre à jour le statut de la demande (ex: LEADER_APPROVED, REJECTED...)
    const request = await prisma.roleRequest.update({
      where: { id: requestId },
      data: { status: newStatus },
      include: { user: true }
    });

    // 2. LOGIQUE SPÉCIALE : Si le statut passe à "INTERCESSOR", on promeut l'utilisateur
    if (newStatus === "INTERCESSOR") {
      await prisma.user.update({
        where: { id: request.userId },
        data: { role: "INTERCESSOR" }
      });
    }

    revalidatePath("/dashboard/leader/team");
    return { success: true, message: "Statut de la candidature mis à jour." };
  } catch (error) {
    return { success: false, message: "Erreur opération." };
  }
}

// --- GESTION DES MEMBRES ACTUELS ---

export async function getTeamMembers() {
  await checkLeaderAccess();
  try {
    const members = await prisma.user.findMany({
      where: { role: "INTERCESSOR" },
      select: { id: true, name: true, email: true, phone: true, image: true, createdAt: true },
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
    // Rétrogradation en simple utilisateur
    await prisma.user.update({
      where: { id: userId },
      data: { role: "REQUESTER" }
    });
    
    // Nettoyage : On supprime l'ancienne demande de rôle si elle existe encore
    await prisma.roleRequest.deleteMany({
        where: { userId: userId }
    });

    revalidatePath("/dashboard/leader/team");
    return { success: true, message: "Membre retiré de l'équipe." };
  } catch (error) {
    return { success: false, message: "Erreur lors du retrait du membre." };
  }
}