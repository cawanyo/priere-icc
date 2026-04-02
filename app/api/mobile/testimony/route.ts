import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 10;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [testimonies, total] = await Promise.all([
      prisma.testimony.findMany({
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { name: true, image: true } },
          images: true,
        },
      }),
      prisma.testimony.count({ where: { status: "APPROVED" } }),
    ]);

    return NextResponse.json({ testimonies, total, page, limit });
  } catch (error) {
    console.error("[MOBILE_TESTIMONY_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, content, audioUrl } = body;

    if (!name) {
      return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    }

    if (!content && !audioUrl) {
      return NextResponse.json({ error: "Contenu ou audio requis" }, { status: 400 });
    }

    const testimony = await prisma.testimony.create({
      data: { name, content: content || null, audioUrl: audioUrl || null, userId, status: "PENDING" },
    });

    return NextResponse.json({ testimony });
  } catch (error) {
    console.error("[MOBILE_TESTIMONY_POST_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
