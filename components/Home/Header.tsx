// components/Home/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react"; 
import Image from "next/image";
import { NotificationBell } from "../layout/notifications";

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header 
        className="fixed top-0 left-0 right-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md safe-padding-top"
        style={{
          transform: "translateZ(0)",
          WebkitTransform: "translateZ(0)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
    >
      <div className="container mx-auto px-4 md:px-6 h-14 sm:h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <div className="flex items-center gap-2">
            <Link href={session?.user ? "/dashboard" : "/login"} className="flex items-center gap-2 font-bold text-lg sm:text-xl tracking-tight">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center p-[2px]">
                <Image 
                  src={'/icc.jpeg'} 
                  height={64} 
                  width={64} 
                  alt="ICC Logo"
                  className="rounded-full bg-white object-cover h-full w-full" 
                />
            </div>
            <span className="text-indigo-900 hidden sm:inline-block">ICC</span>
            <span className="text-pink-600">Prière</span>
            </Link>
        </div>

        {/* NAVIGATION DESKTOP POUR MEMBRES CONNECTÉS */}
        {session?.user && (
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-pink-600 ${
                pathname === "/dashboard"
                  ? "text-pink-600 font-bold" 
                  : "text-gray-600" 
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/desktop/planning"
              className={`text-sm font-medium transition-colors hover:text-pink-600 ${
                pathname.startsWith("/dashboard/desktop/planning") || pathname.startsWith("/dashboard/mobile/planning")
                  ? "text-pink-600 font-bold" 
                  : "text-gray-600" 
              }`}
            >
              Planning
            </Link>
            <Link
              href="/dashboard/desktop/prayer-house"
              className={`text-sm font-medium transition-colors hover:text-pink-600 ${
                pathname.includes("prayer-house")
                  ? "text-pink-600 font-bold" 
                  : "text-gray-600" 
              }`}
            >
              Maison de Prière
            </Link>
          </nav>
        )}

        {/* ESPACE UTILISATEUR CONNECTÉ UNIQUEMENT (Pas de boutons connexion/rejoindre ni de 3 traits) */}
        {session?.user && (
          <div className="flex items-center gap-2 md:gap-3">
              <NotificationBell />
          </div>
        )}
        
      </div>
    </header>
  );
}
