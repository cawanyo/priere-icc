// app/api/register/route.tsx

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { formSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  try {
    const json = await req.json();

    const validationResult = formSchema.safeParse(json);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Champs invalides", errors: validationResult.error.issues },
        { status: 400 }
      );
    }
    
    const { name, email, phone, password } = validationResult.data;

    const cleanName = name ? name.trim() : "";
    const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : null;
    const cleanPhone = phone && phone.trim() ? phone.trim().replace(/\s+/g, "") : null;

    if (!cleanEmail && !cleanPhone) {
      return NextResponse.json(
        { message: "Vous devez fournir soit un email, soit un numéro de téléphone." },
        { status: 400 }
      );
    }

    const orConditions: { email?: string; phone?: string }[] = [];
    if (cleanEmail) orConditions.push({ email: cleanEmail });
    if (cleanPhone) orConditions.push({ phone: cleanPhone });

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: orConditions,
      },
    });

    if (existingUser) {
      return NextResponse.json({ message: "User exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { 
        id: crypto.randomUUID(),
        name: cleanName, 
        email: cleanEmail, 
        phone: cleanPhone, 
        password: hashedPassword,
        role: "PRAYER_LEADER",
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({ message: "User created", user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ message: "Erreur lors de la création du compte" }, { status: 500 });
  }
}
