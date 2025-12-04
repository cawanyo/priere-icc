// components/auth/SessionWatcher.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function SessionWatcher() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Liste des chemins publics qui ne nécessitent pas de redirection
    const publicPaths = ["/", "/login", "/signup", "/testimonies", "/forgot-password"];
    
    // On vérifie si le chemin actuel est public
    const isPublicPath = publicPaths.some(path => 
      pathname === path || (path !== "/" && pathname.startsWith(path))
    );

    // Exception : /testimonies/submit est protégé, même si /testimonies est public
    const isProtectedException = pathname === "/testimonies/submit";

    // Si l'utilisateur n'est plus connecté ("unauthenticated") ET qu'il est sur une page protégée
    // On le redirige vers la page d'accueil ou de login
    if (status === "unauthenticated" && (!isPublicPath || isProtectedException)) {
      router.push("/login"); // Ou "/" selon votre préférence
    }
  }, [status, pathname, router]);

  return null; // Ce composant n'affiche rien visuellement
}