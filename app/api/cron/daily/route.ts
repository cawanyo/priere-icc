import { sendEmail } from "@/lib/mail";

export async function GET() {
    // 🔐 Optional security check
  
  
    // 🕒 Your scheduled logic
    console.log("Cron job running");
  
    // Example: send emails, SMS, clean DB, etc.
    sendEmail("jb.awanyo@gmail.com", "Cron Job Executed", "The daily cron job has been executed successfully.");
    return Response.json({ ok: true });
  }
  