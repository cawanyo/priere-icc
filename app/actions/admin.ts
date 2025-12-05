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