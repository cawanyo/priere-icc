// app/actions/auth-reset.ts
"use server";

import { sendEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

// 1. Chercher l'utilisateur et ses options de contact
export async function findUserForReset(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, phone: true }
    });

    if (!user) {
      // Par sécurité, on peut renvoyer une erreur générique ou faire semblant
      // Mais pour l'UX ici, disons qu'on informe l'utilisateur
      return { success: false, message: "Aucun compte associé à cet email." };
    }

    // Masquer les infos pour l'affichage
    const maskedEmail = user.email ? user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : "";
    const maskedPhone = user.phone ? user.phone.replace(/(\+\d{2,3})(\d{2}).*(\d{2})/, "$1 $2 ** ** $3") : "";

    return { 
      success: true, 
      user: { 
        id: user.id, 
        hasPhone: !!user.phone, 
        maskedEmail, 
        maskedPhone 
      } 
    };
  } catch (error) {
    return { success: false, message: "Erreur serveur." };
  }
}

// 2. Générer et Envoyer le code
export async function sendResetCode(userId: string, method: "email" | "sms") {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, message: "Utilisateur introuvable." };

    // Générer un code à 6 chiffres
    const code = randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // Valide 15 min

    // Sauvegarder le token (On nettoie les anciens d'abord)
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
    await prisma.passwordResetToken.create({
      data: {
        userId,
        token: code,
        expires
      }
    });

    if (method === "sms" && user.phone) {
      await sendSMS(user.phone, `Votre code de réinitialisation ICC Prière est : ${code}. Valide 15 min.`);
      return { success: true, message: "Code envoyé par SMS." };
    } else {
        if (user.email) {
            const emailHtml = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4f46e5;">Réinitialisation de mot de passe</h1>
                <p>Bonjour ${user.name || "Intercesseur"},</p>
                <p>Vous avez demandé à réinitialiser votre mot de passe sur ICC Prière.</p>
                <p>Voici votre code de vérification :</p>
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; font-size: 24px; letter-spacing: 5px; font-weight: bold; color: #1f2937;">
                  ${code}
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Ce code est valide pendant 15 minutes.</p>
                <p style="color: #6b7280; font-size: 14px;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
              </div>
            `;
    
            await sendEmail(user.email, "Code de réinitialisation ICC Prière", emailHtml);
            return { success: true, message: `Code envoyé à ${user.email}` };
          } else {
            return { success: false, message: "Aucun email associé à ce compte." };
          }
    }

  } catch (error) {
    return { success: false, message: "Erreur lors de l'envoi." };
  }
}

// 3. Vérifier le code et changer le mot de passe
export async function resetPasswordWithCode(userId: string, code: string, newPassword: string) {
  try {
    // Vérifier le token
    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: { userId, token: code }
    });

    if (!tokenRecord) {
      return { success: false, message: "Code invalide." };
    }

    if (tokenRecord.expires < new Date()) {
      return { success: false, message: "Code expiré." };
    }

    // Hasher et mettre à jour
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // Nettoyage
    await prisma.passwordResetToken.delete({ where: { id: tokenRecord.id } });

    return { success: true, message: "Mot de passe modifié avec succès !" };
  } catch (error) {
    return { success: false, message: "Erreur lors de la réinitialisation." };
  }
}