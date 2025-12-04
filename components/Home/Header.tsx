// components/Home/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react"; 
import { Menu, LogOut, User, ShieldCheck, HeartHandshake } from "lucide-react";

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

  // Navigation de base visible par tous
  const navigation = [
    { name: "Accueil", href: "/" },
    { name: "Déposer une prière", href: "/prayer" },
    // "Mes Requêtes" est géré dynamiquement ci-dessous pour les utilisateurs connectés
    { name: "Témoignages", href: "/testimonies" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="h-12 w-12 rounded-full flex items-center justify-center p-[2px]">
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

        {/* NAVIGATION DESKTOP */}
        <nav className="hidden md:flex items-center gap-6">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-pink-600 ${
                pathname === item.href
                  ? "text-pink-600 font-bold" 
                  : "text-gray-600" 
              }`}
            >
              {item.name}
            </Link>
          ))}
          
          {/* Lien spécifique pour les membres connectés */}
          {session?.user && (
             <Link
             href="/dashboard"
             className={`text-sm font-medium transition-colors hover:text-pink-600 ${
               pathname.startsWith("/dashboard")
                 ? "text-pink-600 font-bold" 
                 : "text-gray-600" 
             }`}
           >
             Dashboard
           </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
            {/* BOUTONS NON CONNECTÉ */}
            {!session?.user && (
                <div className="hidden md:flex gap-2">
                    <Button variant="ghost" className="text-gray-600 hover:text-pink-600" asChild>
                        <Link href="/login">Connexion</Link>
                    </Button>
                    <Button className="bg-pink-600 hover:bg-pink-700 text-white rounded-full px-6" asChild>
                        <Link href="/signup">Rejoindre</Link>
                    </Button>
                </div>
            )}
            

            {/* --- MENU MOBILE & UTILISATEUR --- */}
            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        {session?.user ? (
                        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full border border-gray-100 shadow-sm">
                            <Avatar className="h-full w-full">
                                <AvatarImage src={session.user.image || ""} alt={session.user.name || "User"} />
                                <AvatarFallback className="bg-indigo-50 text-indigo-700 font-semibold">
                                    {session.user.name?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </Button> )
                        :
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="h-6 w-6 text-gray-700"/>
                        </Button>
                        }
                    </DropdownMenuTrigger>
                    
                    <DropdownMenuContent className="w-56 mt-2" align="end" forceMount>
                        
                        {/* Navigation Mobile */}
                        <div className="md:hidden">
                            {navigation.map((item) => (
                                <DropdownMenuItem key={`mobile-${item.href}`} asChild>
                                    <Link href={item.href} className={pathname === item.href ? "text-pink-600 font-medium" : ""}>
                                        {item.name}
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                            {session?.user && (
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard" className="text-pink-600 font-medium">
                                        Dashboard
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                        </div>
                        
                        {/* Menu Utilisateur Connecté */}
                        {session?.user ? (
                            <>
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

                                {/* Section Admin (Conditionnelle) */}
                                {session.user.role === "ADMIN" && (
                                    <DropdownMenuItem asChild className="cursor-pointer bg-red-50 text-red-700 focus:bg-red-100 focus:text-red-800 mt-1">
                                        <Link href="/dashboard/admin/users">
                                            <ShieldCheck className="mr-2 h-4 w-4" /> Administration
                                        </Link>
                                    </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer focus:bg-red-50" onClick={() => signOut({ callbackUrl: "/" })}>
                                    <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
                                </DropdownMenuItem>
                            </>
                        ) : (
                            // Menu Mobile Non Connecté
                            <div className="md:hidden">
                                <DropdownMenuItem asChild>
                                    <Link href="/login">Connexion</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="font-semibold text-pink-600">
                                    <Link href="/signup">S'inscrire</Link>
                                </DropdownMenuItem>
                            </div>
                        )}
                        
                    </DropdownMenuContent>
                </DropdownMenu>
               {session?.user && <NotificationBell /> } 
            </div>
        </div>
        
      </div>
    </header>
  );
}