// app/actions/team.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";
import supabase from "@/lib/superbase";
import { sendEmail } from "@/lib/mail";

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

// --- GESTION DES CANDIDATURES ---

export async function getRoleRequests(status: string = "ALL") {
  try {
    await checkLeaderAccess();
    const whereClause: any = {};
    if (status && status !== "ALL") {
      whereClause.status = status;
    }
    const requests = await prisma.roleRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, image: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return { success: true, data: requests };
  } catch (error: any) {
    return { success: false, error: error?.message || "Erreur chargement demandes" };
  }
}

export async function updateRoleRequestStatus(requestId: string, newStatus: string) {
  try {
    await checkLeaderAccess();

    // 1. Récupérer la demande pour connaître le rôle visé ET les infos utilisateur
    const request = await prisma.roleRequest.findUnique({ 
        where: { id: requestId },
        include: { user: true }
    });
    
    if (!request) throw new Error("Demande introuvable");

    // 2. Mise à jour du statut
    await prisma.roleRequest.update({
      where: { id: requestId },
      data: { status: newStatus },
    });

    const roleLabel = request.role === "PRAYER_LEADER" ? "Conducteur de prière" : "Intercesseur";

    // 3. Gestion de la promotion et Notification
    if (newStatus === "APPROVED") {
      // Promotion de l'utilisateur
      await prisma.user.update({
        where: { id: request.userId },
        data: { role: request.role }
      });

      await createNotification(
        request.userId,
        "Candidature acceptée 🎉",
        `Félicitations ! Vous avez officiellement rejoint l'équipe en tant que ${roleLabel}.`,
        "SUCCESS",
        "/dashboard/user/profile"
      );

      if (request.user.email) {
        await sendEmail(
          request.user.email,
          "Candidature acceptée 🎉",
          `Félicitations ${request.user.name} ! Nous sommes ravis de vous informer que votre demande pour rejoindre l’équipe des ${roleLabel}s a été acceptée. Bienvenue dans notre ministère !`
        );
      }
    } else if (newStatus === "REJECTED") {
      await createNotification(
        request.userId,
        "Mise à jour candidature",
        `Votre demande pour devenir ${roleLabel} n'a pas été retenue pour le moment.`,
        "INFO",
        "/dashboard/user/profile"
      );
      if (request.user.email) {
        await sendEmail(
          request.user.email,
          "Mise à jour candidature",
          `Bonjour ${request.user.name}, Votre demande a été rejetée. Rapprochez-vous d'un leader pour échanger.`
        );
      }
    }

    await supabase.channel(`user-${request.userId}`).send({
      type: 'broadcast',
      event: 'role-update',
      payload: { status: newStatus, newRole: request.role }
    });

    await supabase.channel('admin-dashboard').send({
      type: 'broadcast',
      event: 'request-handled',
      payload: { requestId, status: newStatus }
    });

    revalidatePath("/dashboard/leader/team");
    return { success: true, message: "Statut mis à jour et notification envoyée." };
  } catch (error: any) {
    return { success: false, message: error?.message || "Erreur opération." };
  }
}

// --- GESTION DES MEMBRES ---

export async function getTeamMembers(availabilityCheck?: { start: Date; end: Date }) {
  try {
    await checkLeaderAccess();

    const whereClause: any = { 
      role: { in: ["INTERCESSOR", "PRAYER_LEADER", "LEADER"] } 
    };

    // Si on cherche des dispos pour un créneau précis
    if (availabilityCheck) {
      whereClause.unavailabilities = {
        none: {
          AND: [
            { startTime: { lt: availabilityCheck.end } },
            { endTime: { gt: availabilityCheck.start } }
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
      data: { role: "REQUESTER" } // Retour case départ
    });
    
    // Nettoyage de l'ancienne demande
    await prisma.roleRequest.deleteMany({ where: { userId: userId } });

    revalidatePath("/dashboard/leader/team");

    await supabase.channel(`user-${userId}`).send({
      type: 'broadcast',
      event: 'role-update',
      payload: { status: '', newRole: '' }
    });

    await supabase.channel('admin-dashboard').send({
      type: 'broadcast',
      event: 'request-handled',
      payload: { requestId: null, status: 'REMOVED' }
    });

    await createNotification(
      userId,
      "Retrait de l'équipe",
      "Vous avez été retiré de l'équipe des intercesseurs/conducteurs de prière.",
      "WARNING",
      "/dashboard/user/profile"
    );

    return { success: true, message: "Membre retiré." };
  } catch (error: any) {
    return { success: false, message: error?.message || "Erreur lors du retrait." };
  }
}
