"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import * as z from "zod";

const unavailabilitySchema = z.object({
  dateRange: z.object({
    from: z.date(),
    to: z.date().optional(),
  }),
  reason: z.string().optional(),
});

export async function addUnavailability(data: any) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session || !session.user?.id) throw new Error("Non connecté");

  try {
    const { dateRange, reason } = unavailabilitySchema.parse(data);

    const startDate = dateRange.from;
    const endDate = dateRange.to || dateRange.from;

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    await prisma.unavailability.create({
      data: {
        // @ts-ignore
        userId: session.user.id,
        startDate: start,
        endDate: end,
        reason: reason || "Indisponible",
      },
    });

    revalidatePath("/dashboard/user/intercessor/availability");
    return { success: true, message: "Indisponibilité ajoutée." };
  } catch (error) {
    return { success: false, message: "Erreur lors de l'ajout." };
  }
}

export async function getUserUnavailabilities() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session || !session.user?.id) throw new Error("Non connecté");

  try {
    // Créer une date correspondant au début de la journée actuelle (minuit)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const items = await prisma.unavailability.findMany({
      where: { 
        // @ts-ignore
        userId: session.user.id,
        // FILTRE AJOUTÉ : Uniquement celles qui commencent aujourd'hui ou plus tard
        // (Ou celles qui finissent après aujourd'hui si vous voulez inclure les cours)
        // Ici je suis votre demande "start from current date"
        startDate: {
            gte: today 
        }
      },
      orderBy: { startDate: "asc" },
    });
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: "Impossible de charger les disponibilités." };
  }
}

export async function deleteUnavailability(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Non connecté");

  try {
    await prisma.unavailability.delete({
      where: { id },
    });
    revalidatePath("/dashboard/user/intercessor/availability");
    return { success: true, message: "Supprimé avec succès." };
  } catch (error) {
    return { success: false, message: "Erreur suppression." };
  }
}