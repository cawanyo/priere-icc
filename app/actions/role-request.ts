"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import supabase from "@/lib/superbase";


export async function createRoleRequest(roleToRequest: Role) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session || !session.user?.id) throw new Error("Non autorisé");

  try {
    const existing = await prisma.roleRequest.findUnique({ 
        // @ts-ignore
        where: { userId: session.user.id } 
    });

    if (existing) {
        // Si une demande est strictement EN COURS, on bloque
        if (existing.status === "PENDING") {
            throw new Error("Une demande est déjà en cours de traitement.");
        }
        
        // Si la demande est terminée (Refusée ou Validée par le passé), on la supprime pour en créer une nouvelle
        // Cela permet l'upgrade (Conducteur -> Intercesseur) ou la retentative après refus
        await prisma.roleRequest.delete({ where: { id: existing.id } });
    }

    await prisma.roleRequest.create({
      data: {
        // @ts-ignore
        userId: session.user.id,
        role: roleToRequest,
        status: "PENDING"
      }
    });

    await supabase.channel('admin-dashboard').send({
      type: 'broadcast',
      event: 'new-request', 
      payload: { message: 'Nouvelle demande de rôle' }
    });

    await supabase.channel(`user-${session.user.id}`).send({
      type: 'broadcast',
      event: 'role-update', 
      payload: { message: 'Nouvelle demande de rôle' }
    });
    

    revalidatePath("/dashboard/user/profile");
    return { success: true, message: `Candidature envoyée.` };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur serveur" };
  }
}

// ... deleteRoleRequest reste inchangé
export async function deleteRoleRequest() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session || !session.user?.id) throw new Error("Non autorisé");

  try {
    await prisma.roleRequest.delete({
      // @ts-ignore
      where: { userId: session.user.id }
    });


    await supabase.channel('admin-dashboard').send({
      type: 'broadcast',
      event: 'new-request', 
      payload: { message: 'Nouvelle demande de rôle' }
    });
    
    await supabase.channel(`user-${session.user.id}`).send({
      type: 'broadcast',
      event: 'role-update', 
      payload: { message: 'Nouvelle demande de rôle' }
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
            roleRequest: { select: { status: true, role: true } } // On récupère le statut de la demande
        }
      });

    return user;
}