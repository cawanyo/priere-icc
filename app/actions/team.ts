// app/actions/team.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { sendSMS } from "@/lib/sms";
import { createNotification } from "./notifications";
import supabase from "@/lib/superbase";
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
    // 1. Récupérer la demande pour connaître le rôle visé ET les infos utilisateur (téléphone)
    const request = await prisma.roleRequest.findUnique({ 
        where: { id: requestId },
        include: { user: true } // Important pour avoir le numéro de téléphone
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
      // Promotion
      await prisma.user.update({
        where: { id: request.userId },
        data: { role: request.role }
      });

      // Notification SMS

      await createNotification(
        request.userId,
        "Candidature acceptée 🎉",
        `Félicitations ! Vous avez officiellement rejoint l'équipe en tant que ${roleLabel}.`,
        "SUCCESS",
        "/dashboard/user/profile" // Lien vers le profil pour voir le statut
      );

      if (request.user.phone) {
        const roleLabel = request.role === "PRAYER_LEADER" ? "Conducteur de prière" : "Intercesseur";
        await sendSMS(
            request.user.phone,
            `Félicitations ${request.user.name} ! Nous sommes ravis de vous informer que votre demande pour rejoindre l’équipe des ${roleLabel}s a été acceptée. Bienvenue dans notre ministère !`
        );
      }
    } else if (newStatus === "REJECTED" && request.user.phone) {
        await createNotification(
            request.userId,
            "Mise à jour candidature",
            `Votre demande pour devenir ${roleLabel} n'a pas été retenue pour le moment.`,
            "INFO",
            "/dashboard/user/profile"
        );
        // Optionnel : Notifier le refus
        await sendSMS(request.user.phone, `Bonjour ${request.user.name}, Votre demande a été rejeté. Rapprochez-vous d'un leader pour échanger.`);
    }

    await supabase.channel(`user-${request.userId}`).send({
      type: 'broadcast',
      event: 'role-update',
      payload: { status: newStatus, newRole: request.role }
    });

    await supabase.channel('admin-dashboard').send({
      type: 'broadcast',
      event: 'request-handled',
      payload: { requestId, status: 'APPROVED' }
    });

    
    revalidatePath("/dashboard/leader/team");
    return { success: true, message: "Statut mis à jour et notification envoyée." };
  } catch (error) {
    return { success: false, message: "Erreur opération." };
  }
}

// --- GESTION DES MEMBRES ---

export async function getTeamMembers(availabilityCheck?: { start: Date; end: Date }) {
  await checkLeaderAccess();
  
  try {
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
      "/dashboard/user/profile");

    return { success: true, message: "Membre retiré." };
  } catch (error) {
    return { success: false, message: "Erreur lors du retrait." };
  }
}