// lib/mail.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Adresse d'expédition (Doit être vérifiée sur Resend, ou utiliser onboarding@resend.dev pour tester)
const FROM_EMAIL = "ICC Prière <priere@icctoulouse.dev>"; 

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!process.env.RESEND_API_KEY) {
    console.log("⚠️ RESEND_API_KEY manquant. Email non envoyé.");
    console.log(`To: ${to}, Subject: ${subject}`);
    return { success: false, error: "Configuration manquante" };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: to,
      subject: subject,
      html: html,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Erreur envoi email:", error);
    return { success: false, error };
  }
};