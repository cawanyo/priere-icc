// app/actions/testimony.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";
import * as z from "zod";

// Schéma de validation serveur
// On accepte 'any' pour audio/images car FormData renvoie des objets File difficiles à valider strictement avec Zod sans transformation préalable
const testimonySchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  content: z.string().optional(),
  audio: z.any().optional(),
}).refine((data) => {
  // Règle : Soit du texte, soit un fichier audio valide (taille > 0)
  const hasText = data.content && data.content.trim().length > 0;
  const hasAudio = data.audio && data.audio.size > 0;
  return hasText || hasAudio;
}, {
  message: "Un témoignage écrit ou audio est requis.",
  path: ["content"]
});

export async function createTestimony(formData: FormData) {
  const session = await getServerSession(authOptions);
  
  const rawData = {
    name: formData.get("name") as string,
    content: formData.get("content") as string,
    audio: formData.get("audio") as File | null,
  };

  const validation = testimonySchema.safeParse(rawData);
  if (!validation.success) {
    // Renvoie la première erreur trouvée
    return { success: false, message: validation.error.issues[0].message };
  }

  const imageFiles = formData.getAll("images") as File[];

  try {
    let audioUrl = null;
    let uploadedImages: string[] = [];

    // 1. Upload Audio
    if (rawData.audio && rawData.audio.size > 0) {
      const audioResult = await uploadToCloudinary(rawData.audio, "icc-prayers/audios");
      audioUrl = audioResult.secure_url;
    }

    // 2. Upload Images (Correction boucle)
    if (imageFiles && imageFiles.length > 0) {
      const uploadPromises = imageFiles.map(async (file) => {
        if (file instanceof File && file.size > 0) {
            return uploadToCloudinary(file, "icc-prayers/images");
        }
        return null;
      });
      
      const results = await Promise.all(uploadPromises);
      // Filtrer les nulls et extraire secure_url
      uploadedImages = results.filter(r => r !== null).map(r => r.secure_url);
    }

    // 3. Sauvegarde
    await prisma.testimony.create({
      data: {
        name: rawData.name,
        content: rawData.content,
        audioUrl,
        userId: session?.user?.id || null, // @ts-ignore
        status: "APPROVED",
        images: {
            create: uploadedImages.map(url => ({ url }))
        }
      }
    });

    if (session) revalidatePath("/dashboard/user/testimonies");
    
    return { success: true, message: "Témoignage envoyé pour validation !" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Erreur lors de l'envoi." };
  }
}

// ... getPublicTestimonies et getUserTestimonies restent similaires
// Juste ajouter `include: { images: true }` dans les requêtes prisma.
export async function getPublicTestimonies() {
  try {
    const testimonies = await prisma.testimony.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      include: { 
        images: true, // IMPORTANT
        user: { select: { image: true } } // Pour l'avatar
      } 
    });
    return { success: true, data: testimonies };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function getUserTestimonies() {
  const session = await getServerSession(authOptions);
  // @ts-ignore
  if (!session?.user?.id) throw new Error("Non connecté");

  try {
    const testimonies = await prisma.testimony.findMany({
      // @ts-ignore
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { 
        images: true // IMPORTANT
      }
    });
    return { success: true, data: testimonies };
  } catch (error) {
    return { success: false, error: "Erreur chargement" };
  }
}