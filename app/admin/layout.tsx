// app/dashboard/admin/layout.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkAdmin } from "../actions/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try{
    const user = await checkAdmin();

    // @ts-ignore : On vérifie que l'utilisateur est connecté ET qu'il a le rôle ADMIN
    if (!user|| user?.role !== "ADMIN") {
        redirect("/"); 
    }
  }
  catch(e) {
    redirect("/")
  }
  

  // Si c'est un admin, on affiche le contenu (les pages enfants)
  return <>{children}</>;
}