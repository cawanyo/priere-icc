// app/api/prayers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prayerSchema } from "@/lib/validations/prayer";
import { createNotification } from "@/app/actions/notifications";

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

    const leaders = await prisma.user.findMany({
      where: {
        role: { in: ["LEADER", "ADMIN"] }
      },
      select: { id: true }
    });

    // // On envoie une notif à chacun
    // const notifPromises = leaders.map(leader => 
    //   createNotification(
    //     leader.id,
    //     "Nouvelle requête 🙏",
    //     `Une nouvelle demande de prière (${subjectType}) a été déposée par ${prayer.name || "un visiteur"}.`,
    //     "INFO",
    //     "/dashboard/leader/prayer" // Lien direct vers le mur
    //   )
    // );

    // await Promise.all(notifPromises);

    return NextResponse.json({ message: "Prière soumise avec succès", prayer }, { status: 201 });
  } catch (error) {
    console.error("Erreur soumission prière:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}