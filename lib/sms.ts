// lib/sms.ts
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// On initialise le client seulement si les clés sont présentes
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function sendSMS(to: string, message: string) {
  if (!client) {
    console.warn("⚠️ Twilio non configuré. SMS non envoyé à", to);
    console.log("Message:", message);
    return { success: false, error: "Configuration manquante" };
  }

  try {
    // Nettoyage basique du numéro (Twilio veut du E.164, ex: +33612345678)
    // Si vos numéros en base sont déjà propres, c'est parfait.
    // Sinon, assurez-vous qu'ils commencent par +
    
    await client.messages.create({
      body: message,
      from: fromNumber,
      to: to,
    });
    
    return { success: true };
  } catch (error) {
    console.error("Erreur envoi SMS:", error);
    return { success: false, error };
  }
}