// app/api/register/route.tsx

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import * as z from "zod";
import { formSchema } from "@/lib/validations/auth";

// 1. DÉFINITION DU SCHÉMA DE VALIDATION CÔTÉ SERVEUR

export async function POST(req: Request) {
  try {
    const json = await req.json();

    const validationResult = formSchema.safeParse(json);
    if (!validationResult.success) {
        return NextResponse.json({ message: "Invalid input fields", errors: validationResult.error.issues }, { status: 400 });
    }
    
    const { name, email, phone, password } = validationResult.data;

    const actualEmail = email || undefined;
    const actualPhone = phone || undefined;


    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: actualEmail },
                { phone: actualPhone }
            ],
            NOT: {
                AND: [
                    { email: null, phone: null }
                ]
            }
        }
    });

    if (existingUser) {
        return NextResponse.json({ message: "User exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { 
        name, 
        email: actualEmail, 
        phone: actualPhone, 
        password: hashedPassword 
      },
    });


    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({ message: "User created", user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ message: "Error creating account" }, { status: 500 });
  }
}