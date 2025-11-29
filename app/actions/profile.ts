// app/actions/profile.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import * as z from "zod";
import { passwordSchema, profileSchema } from "@/lib/validations/auth";

// --- Schémas de validation ---


// --- Actions ---

export async function updateProfile(data: z.infer<typeof profileSchema>) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session || !session.user?.id) throw new Error("Non autorisé");

  try {
    const validatedData = profileSchema.parse(data);

    await prisma.user.update({
      // @ts-ignore
      where: { id: session.user.id },
      data: {
        name: validatedData.name,
        phone: validatedData.phone || null,
      },
    });

    revalidatePath("/dashboard/user/profile");
    return { success: true, message: "Profil mis à jour avec succès." };
  } catch (error) {
    return { success: false, message: "Erreur lors de la mise à jour du profil." };
  }
}

export async function updatePassword(data: z.infer<typeof passwordSchema>) {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session || !session.user?.id) throw new Error("Non autorisé");

  try {
    const { currentPassword, newPassword } = passwordSchema.parse(data);

    // 1. Récupérer l'utilisateur pour avoir le hash actuel
    const user = await prisma.user.findUnique({
      // @ts-ignore
      where: { id: session.user.id },
    });

    if (!user || !user.password) {
      return { success: false, message: "Impossible de vérifier votre mot de passe (Compte Google ?)." };
    }

    // 2. Vérifier l'ancien mot de passe
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return { success: false, message: "Le mot de passe actuel est incorrect." };
    }

    // 3. Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Mettre à jour
    await prisma.user.update({
      // @ts-ignore
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return { success: true, message: "Mot de passe modifié avec succès." };
  } catch (error) {
    return { success: false, message: "Erreur lors du changement de mot de passe." };
  }
}