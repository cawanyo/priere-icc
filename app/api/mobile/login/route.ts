import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = body.identifier?.trim();
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json({ message: "Champs requis" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
      include: { prayerFamily: true },
    });

    if (!user || !user.password) {
      return NextResponse.json({ message: "Identifiants invalides" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ message: "Identifiants invalides" }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        image: user.image,
        prayerFamily: user.prayerFamily,
      },
    });
  } catch (error) {
    console.error("[MOBILE_LOGIN_ERROR]", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
