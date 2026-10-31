import { NextRequest, NextResponse } from "next/server";
import { sendScheduledReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");

    // Sécurité conditionnelle : si CRON_SECRET est configuré dans l'environnement
    if (process.env.CRON_SECRET) {
      const isValid =
        authHeader === `Bearer ${process.env.CRON_SECRET}` ||
        secret === process.env.CRON_SECRET;
      if (!isValid) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
    }

    const forceEve = searchParams.get("forceEve") === "true";
    const force1h = searchParams.get("force1h") === "true";

    const stats = await sendScheduledReminders({ forceEve, force1h });

    return NextResponse.json({
      success: true,
      message: "Rappels automatiques traités avec succès",
      stats,
    });
  } catch (error) {
    console.error("[CRON REMINDERS ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur interne",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
