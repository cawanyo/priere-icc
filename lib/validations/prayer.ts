import z from "zod";

export const prayerSchema = z.object({
    subjectType: z.string("Veuillez choisir un type."),
    content: z.string().min(10, "Votre sujet doit être plus détaillé (min 10 car.)."),
    name: z.string().min(2, "Nom requis.").optional().or(z.literal("")),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
  }).refine((data) => !!data.email || !!data.phone, {
    message: "Vous devez renseigner au moins un moyen de contact (Email ou Téléphone).",
    path: ["email"], // L'erreur s'affichera sous l'email
  });
  
export   type PrayerFormValues = z.infer<typeof prayerSchema>;