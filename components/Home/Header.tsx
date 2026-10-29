// components/Home/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react"; 
import { LogOut, User, ShieldCheck, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { NotificationBell } from "../layout/notifications";

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header 
        className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md safe-padding-top"   
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
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full border border-gray-100 shadow-sm">
                          <Avatar className="h-full w-full">
                              <AvatarImage src={session.user.image || ""} alt={session.user.name || "User"} />
                              <AvatarFallback className="bg-indigo-50 text-indigo-700 font-semibold">
                                  {session.user.name?.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                          </Avatar>
                      </Button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent className="w-56 mt-2" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                              <p className="text-sm font-medium leading-none text-indigo-900">{session.user.name}</p>
                              <p className="text-xs leading-none text-muted-foreground truncate">{session.user.email}</p>
                          </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem asChild className="cursor-pointer">
                          <Link href="/dashboard/user/profile">
                              <User className="mr-2 h-4 w-4" /> Mon Profil
                          </Link>
                      </DropdownMenuItem>

                      {/* Section Admin / Leader (Conditionnelle) */}
                      {session.user.role === "ADMIN" && (
                          <DropdownMenuItem asChild className="cursor-pointer bg-red-50 text-red-700 focus:bg-red-100 focus:text-red-800 mt-1">
                              <Link href="/dashboard/admin/users">
                                  <ShieldCheck className="mr-2 h-4 w-4" /> Administration
                              </Link>
                          </DropdownMenuItem>
                      )}

                      {(session.user.role === "ADMIN" || session.user.role === "LEADER") && (
                          <DropdownMenuItem asChild className="cursor-pointer bg-pink-50 text-pink-700 focus:bg-pink-100 focus:text-pink-800 mt-1">
                              <Link href="/dashboard/leader/team">
                                  <UserPlus className="mr-2 h-4 w-4 text-pink-600" /> Demandes d'adhésion
                              </Link>
                          </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer focus:bg-red-50" onClick={() => signOut({ callbackUrl: "/login" })}>
                          <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
                      </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>

              <NotificationBell />
          </div>
        )}
        
      </div>
    </header>
  );
}
