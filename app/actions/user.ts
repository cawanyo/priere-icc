import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function checkUser() {
    const session = await getServerSession(authOptions);
  
    // 1. Vérifier si une session existe et possède un ID utilisateur
    // @ts-ignore
    if (!session || !session.user || !session.user.id) {
      throw new Error("Non authentifié");
    }
  
  
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
  
  
    return user;
  }