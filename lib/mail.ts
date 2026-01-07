// lib/mail.ts
// import { Resend } from 'resend';

// const resend = new Resend(process.env.RESEND_API_KEY);

// Adresse d'expédition (Doit être vérifiée sur Resend, ou utiliser onboarding@resend.dev pour tester)
const FROM_EMAIL = "ICC Prière <priere@icctoulouse.dev>"; 



export const sendEmail = async (to: string, subject: string, html: string) => {
  // if (!process.env.RESEND_API_KEY) {
  //   console.log("⚠️ RESEND_API_KEY manquant. Email non envoyé.");
  //   console.log(`To: ${to}, Subject: ${subject}`);
  //   return { success: false, error: "Configuration manquante" };
  // }

  // try {
  //   const data = await resend.emails.send({
  //     from: FROM_EMAIL,
  //     to: to,
  //     subject: subject,
  //     html: html,
  //   });

  //   return { success: true, data };
  // } catch (error) {
  //   console.error("Erreur envoi email:", error);
  //   return { success: false, error };
  // }

  try
  {

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: {
          email: "intercession.icctoulouse@gmail.com", // must be verified in Brevo
          name: "Prayer ICC",
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
  
    console.log(res)
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error);
    }
  
    return { success: true };
  

  }
  catch (error) { 
    console.error("Erreur envoi email:", error);
  }

};