// app/api/prayers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prayerSchema } from "@/lib/validations/prayer";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const json = await req.json();

    const validation = prayerSchema.safeParse(json);
    if (!validation.success) {
      return NextResponse.json({ message: "Données invalides", errors: validation.error }, { status: 400 });
    }

    const { subjectType, content, name, email, phone } = validation.data;

    // Création de la prière
    const prayer = await prisma.prayer.create({
      data: {
        subjectType,
        content,
        name: name || session?.user?.name, // Priorité au formulaire, sinon session
        email: email || session?.user?.email,
        // @ts-ignore : phone n'est pas dans le type User par défaut de NextAuth mais peut être dans votre DB
        phone: phone || session?.user?.phone, 
        userId: session?.user?.id, // Lie à l'utilisateur si connecté
      },
    });

    return NextResponse.json({ message: "Prière soumise avec succès", prayer }, { status: 201 });
  } catch (error) {
    console.error("Erreur soumission prière:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}