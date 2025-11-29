// app/actions/role-request.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function createRoleRequest() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session || !session.user?.id) throw new Error("Non autorisé");

  try {
    // Vérifier si une demande existe déjà
    // @ts-ignore
    const existing = await prisma.roleRequest.findUnique({ where: { userId: session.user.id } });
    if (existing) throw new Error("Une demande est déjà en cours.");

    await prisma.roleRequest.create({
      data: {
        // @ts-ignore
        userId: session.user.id,
        status: "PENDING"
      }
    });

    revalidatePath("/dashboard/user/profile");
    return { success: true, message: "Votre demande a été envoyée." };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur serveur" };
  }
}

export async function deleteRoleRequest() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session || !session.user?.id) throw new Error("Non autorisé");

  try {
    await prisma.roleRequest.delete({
      // @ts-ignore
      where: { userId: session.user.id }
    });

    revalidatePath("/dashboard/user/profile");
    return { success: true, message: "Demande annulée avec succès." };
  } catch (error) {
    return { success: false, message: "Erreur lors de l'annulation." };
  }
}


export async function getUserWithRoleRequest() {
    const session = await getServerSession(authOptions);
    const user = await prisma.user.findUnique({
        where: { id: session?.user.id },
        select: { 
            name: true, email: true, phone: true, role: true, password: true,
            roleRequest: { select: { status: true } } // On récupère le statut de la demande
        }
      });

    return user;
}