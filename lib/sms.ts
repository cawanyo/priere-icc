// // lib/sms.ts
// import twilio from "twilio";

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// // On initialise le client seulement si les clés sont présentes
// const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

// export async function sendSMS(to: string, message: string) {
//   if (!client) {
//     console.warn("⚠️ Twilio non configuré. SMS non envoyé à", to);
//     console.log("Message:", message);
//     return { success: false, error: "Configuration manquante" };
//   }

//   try {
//     await client.messages.create({
//       body: message,
//       from: fromNumber,
//       to: to,
//     });
    
//     return { success: true };
//   } catch (error) {
//     console.error("Erreur envoi SMS:", error);
//     return { success: false, error };
//   }
// }



"use server";

const BREVO_API_KEY = process.env.BREVO_API_KEY;

if (!BREVO_API_KEY) {
  throw new Error("BREVO_API_KEY is not defined");
}

export async function sendSMS({
  to,
  message,
}: {
  to: string;      // E.164 format: +1234567890
  message: string; // Max ~160 chars
}) {
  const res = await fetch(
    "https://api.brevo.com/v3/transactionalSMS/sms",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY!,
      },
      body: JSON.stringify({
        sender: "PrayerICC", // SMS sender name (3–11 chars)
        recipient: to,
        content: message,
        type: "transactional",
      }),
    }
  );
  console.log(res);

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }

  return { success: true };
}
