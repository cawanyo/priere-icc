// app/actions/prayer-house.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { checkLeaderAccess } from "./leader";

// Vérification sécu


// --- FAMILLES ---

export async function getPrayerFamilies() {
  await checkLeaderAccess();
  try {
    const families = await prisma.prayerFamily.findMany({
      include: {
        _count: {
          select: { members: true }
        },
        members: {
            select: { image: true, name: true } // Pour afficher quelques avatars
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: families };
  } catch (error) {
    return { success: false, error: "Erreur chargement familles" };
  }
}

export async function createPrayerFamily(data: { name: string, description?: string, color?: string }) {
  await checkLeaderAccess();
  try {
    await prisma.prayerFamily.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color || "#4f46e5"
      }
    });
    revalidatePath("/dashboard/leader/prayer-house");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erreur création famille" };
  }
}

export async function deletePrayerFamily(id: string) {
    await checkLeaderAccess();
    try {
        await prisma.prayerFamily.delete({ where: { id } });
        revalidatePath("/dashboard/leader/prayer-house");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Erreur suppression" };
    }
}


export async function getFamilyDetails(id: string) {
    await checkLeaderAccess();
    try {
      const family = await prisma.prayerFamily.findUnique({
        where: { id },
        include: {
          members: {
              select: { id: true, name: true, image: true, email: true, phone: true }
          }
        }
      });
      
      // On récupère aussi les candidats potentiels (Conducteurs sans famille)
      const candidates = await prisma.user.findMany({
          where: {
              role: "PRAYER_LEADER", // Seuls les conducteurs
              prayerFamilyId: null   // Qui n'ont pas encore de famille
          },
          select: { id: true, name: true, image: true }
      });
  
      return { success: true, family, candidates };
    } catch (error) {
      return { success: false, error: "Famille introuvable" };
    }
  }
  
  export async function addMemberToFamily(familyId: string, userId: string) {
      await checkLeaderAccess();
      try {
          const test = await prisma.user.findUnique({ where: { id: "cmiouuh4j0000l204uewb80vy" } });
          await prisma.user.update({
              where: { id: userId },
              data: { prayerFamilyId: familyId }
          });
          revalidatePath(`/dashboard/leader/prayer-house/${familyId}`);
          return { success: true };
      } catch (error) {
        
          return { success: false, error: "Erreur ajout membre" };
      }
  }
  
  export async function removeMemberFromFamily(userId: string, familyId: string) {
      await checkLeaderAccess();
      try {
          await prisma.user.update({
              where: { id: userId },
              data: { prayerFamilyId: null } // On le détache de la famille
          });
          revalidatePath(`/dashboard/leader/prayer-house/${familyId}`);
          return { success: true };
      } catch (error) {
          return { success: false, error: "Erreur suppression membre" };
      }
  }