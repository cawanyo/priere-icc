// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@icctoulouse1.com'; // 📧 Changez l'email ici
  const password = 'Password123!'; // 🔒 Changez le mot de passe ici

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {}, // Si l'utilisateur existe déjà, on ne fait rien
    create: {
      email,
      name: 'Super Admin',
      password: hashedPassword,
      role: 'ADMIN', // C'est ici qu'on donne les droits d'admin
      phone: '+33600000000', // Optionnel
    },
  });

  console.log({ admin });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });