
import * as z from "zod";

export const formSchema = z
  .object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
    email: z.string().email("Veuillez entrer une adresse email valide.").optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"], 
  })
  .refine((data) => !!data.email || !!data.phone, { 
    message: "Vous devez fournir soit un email, soit un numéro de téléphone.",
    path: ["email"],
  });

export type SignupFormValues = z.infer<typeof formSchema>;


export const loginFormSchema = z.object({
    identifier: z.string().min(1, "Veuillez entrer une adresse email ou un numéro de téléphone."),
  password: z.string().min(1, "Le mot de passe est requis."),
  });
  
export type LoginFormValues = z.infer<typeof loginFormSchema>;


export const profileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  phone: z.string().optional().or(z.literal("")),
  email: z.email("Email incorrect")
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Le mot de passe actuel est requis."),
  newPassword: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères."),
  confirmPassword: z.string().min(1, "La confirmation est requise."),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirmPassword"],
});