// // prisma/seed.ts
// import { PrismaClient } from '@prisma/client';
 import bcrypt from 'bcryptjs';

// const prisma = new PrismaClient();

// async function main() {
//   const email = 'admin@gmail.com'; // 📧 Changez l'email ici
//   const password = 'Test123'; // 🔒 Changez le mot de passe ici

//   const hashedPassword = await bcrypt.hash(password, 10);

//   const admin = await prisma.user.upsert({
//     where: { email },
//     update: {}, // Si l'utilisateur existe déjà, on ne fait rien
//     create: {
//       email,
//       name: 'Super Admin',
//       password: hashedPassword,
//       role: 'ADMIN', // C'est ici qu'on donne les droits d'admin
//       phone: '+3360000000', // Optionnel
//     },
//   });

//   console.log({ admin });
//   // const prayer = await prisma.prayer.deleteMany()


//   // const a = await prisma.planning.deleteMany(
//   //   {where: {specialEventId: null}}
//   // )
// }

// main()
//   .then(async () => {
//     await prisma.$disconnect();
//   })
//   .catch(async (e) => {
//     console.error(e);
//     await prisma.$disconnect();
//     process.exit(1);
//   });


// import { PrismaClient } from '@prisma/client';
// // On importe fs et path pour lire le fichier JSON
// import fs from 'fs';
// import path from 'path';

// const prisma = new PrismaClient();

// async function main() {
//   // 1. Lire le fichier JSON
//   const filePath = path.join(__dirname, 'RoleRequest.json');
//   const rawData = fs.readFileSync(filePath, 'utf-8');
//   const users = JSON.parse(rawData);

//   console.log(`Début de l'import de ${users.length} utilisateurs...`);

//   // 2. Boucle sur chaque utilisateur

//   for (const user of users) {
//     // 3. On utilise upsert :
//     // - Si l'ID existe déjà -> on met à jour (update)
//     // - Si l'ID n'existe pas -> on crée (create)
//     try { 
//       await prisma.roleRequest.upsert({
//         where: { id: user.id },
//         update: {
//           ...user,
//           // Conversion IMPORTANTE des strings en objets Date
//           createdAt: new Date(user.createdAt),
//           updatedAt: new Date(),
//         },
//         create: {
//           ...user,
//           createdAt: new Date(user.createdAt),
//           updatedAt: new Date(),

//         },
//       });
//     }
//     catch (error) {
//       console.error(`Erreur lors de l'import de l'utilisateur avec l'ID ${user.name}:`, error);
//     }
//   }

//   console.log('Import terminé avec succès !');
// }


// import { PrismaClient } from '@prisma/client';
// // On importe fs et path pour lire le fichier JSON
// import fs from 'fs';
// import path from 'path';

// const prisma = new PrismaClient();

// async function main() {

//     const hashedPassword = await bcrypt.hash('Rogierlaureane1234!', 10);
//     try { 
//       const user = await prisma.user.updateMany({
//         where: {
//           email: 'rogierlaureane@gmail.com'
//         },
//         data: {
//           password: hashedPassword
//         }
//       });
      
//       console.log('Utilisateur mis à jour avec succès !', user);
//     }
//     catch (error) {
//       console.error(`Erreur lors de l'import de l'utilisateur avec l'ID`);
//     }

//   console.log('Import terminé avec succès !');
// }

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";
import { addDays, startOfDay, endOfDay, format, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { normalizeDate } from "@/lib/utils";
import { sendEmail } from "@/lib/mail";

// Cette route doit être protégée pour ne pas être appelée par n'importe qui
// Vercel ajoute un header d'authentification spécial pour les Crons
async function main() {
  try {
    // 1. Définir la plage de "Demain"
    const today = normalizeDate(new Date());
    const tomorrow = addDays(today, 1);
    const afterTomorrow = addDays(tomorrow, 1);

    const weekStart = startOfWeek(tomorrow, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(tomorrow), { weekStartsOn: 1 });
    // On cherche si une famille est assignée cette semaine
    const assignment = await prisma.familyWeeklyAssignment.findUnique({
      where: { weekStart },
      include: {
        schedules: {
            include: { user: true,} // On a besoin de voir qui est sur quel créneau
        },
        dayThemes: true
      }
    });
    let smsCount = 0;

    // 3. Boucler et envoyer
    for (const schedule of assignment?.schedules || []) {
      const user = schedule.user;

      // Préparer le message
      let message = `Bonjour ${user?.name},\n\n`;
      message += `🙏 Vous êtes de service pour la Maison de Prière cette semaine !:\n\n`;
      message += `Jour : ${format(schedule?.date, 'EEEE dd MMMM yyyy', { locale: fr })}\n`;
      message += `Créneau: ${schedule.startTime} - ${schedule.endTime}\n`;


      user && user.phone && await sendSMS({to: user.phone, message});
      smsCount++;
      console.log(message)
    }
  

  } catch (error) {
    console.error("[CRON ERROR]", error);
   
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });