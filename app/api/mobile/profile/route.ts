import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        prayerFamily: true,
        roleRequest: true,
        testimonies: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { images: true },
        },
        prayers: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        familySchedules: {
          where: { date: { gte: new Date() } },
          orderBy: { date: "asc" },
          take: 3,
          include: { assignment: { include: { prayerFamily: true } } },
        },
        plannings: {
          where: { date: { gte: new Date() } },
          orderBy: { date: "asc" },
          take: 3,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { password, ...safeUser } = user;

    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error("[MOBILE_PROFILE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, phone, currentPassword, newPassword } = body;

    if (newPassword) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.password) {
        return NextResponse.json({ error: "Impossible de changer le mot de passe" }, { status: 400 });
      }
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name, phone },
      include: { prayerFamily: true, roleRequest: true },
    });

    const { password, ...safeUser } = updated;
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error("[MOBILE_PROFILE_PATCH_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
