import { sendEmail } from "@/lib/mail";
import { sendScheduledReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";

export async function GET() {
  console.log("[Daily Cron] Exécution de la tâche journalière...");

  // Exécuter les rappels de prière
  const stats = await sendScheduledReminders();

  // Notification par e-mail de contrôle
  sendEmail(
    "jb.awanyo@gmail.com",
    "Tâche quotidienne exécutée - Prière ICC",
    `La tâche journalière a été exécutée. Rappels veille envoyés : ${stats.eveRemindersSent}, Rappels 1h envoyés : ${stats.oneHourRemindersSent}.`
  );

  return Response.json({ ok: true, stats });
}
