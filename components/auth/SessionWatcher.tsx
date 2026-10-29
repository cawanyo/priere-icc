"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function SessionWatcher() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Si sur la racine
    if (pathname === "/") {
      if (status === "authenticated") {
        router.replace("/dashboard");
      } else if (status === "unauthenticated") {
        router.replace("/login");
      }
      return;
    }

    // Liste des chemins publics
    const publicPaths = ["/login", "/signup", "/forgot-password"];
    
    const isPublicPath = publicPaths.some(path => 
      pathname === path || pathname.startsWith(path)
    );

    // Si non connecté sur une page protégée
    if (status === "unauthenticated" && !isPublicPath) {
      router.replace("/login");
    }
  }, [status, pathname, router]);

  return null;
}
