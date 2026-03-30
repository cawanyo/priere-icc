import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  try {
    const body = await req.json();
    const { subjectType, content, name, phone } = body;

    if (!subjectType || !content) {
      return NextResponse.json({ error: "Champs requis" }, { status: 400 });
    }

    const prayer = await prisma.prayer.create({
      data: {
        subjectType,
        content,
        name: name || null,
        phone: phone || null,
        userId: userId || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ prayer });
  } catch (error) {
    console.error("[MOBILE_PRAYER_POST_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
