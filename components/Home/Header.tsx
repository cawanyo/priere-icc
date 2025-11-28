"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react"; 
import { Menu, LogOut, User, Settings, LogIn } from "lucide-react";

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

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();


  const navigation = [
    { name: "Accueil", href: "/" },
    { name: "Priere", href: "/prayer" },
    { name: "Mes Requêtes", href: "/dashboard/requests" },
    { name: "Témoignages", href: "/testimonies" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white ">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-secondary to-primary flex items-center justify-center p-[2px]">
                <Image 
                  src={'/icc.jpeg'} 
                  height={64} 
                  width={64} 
                  alt={""}
                  className="rounded-full" 
                />
            </div>
            <span className="text-secondary hidden sm:inline-block">ICC</span>
            <span className="text-primary">Prière</span>
            </Link>
        </div>

        {/* NAVIGATION DESKTOP */}
        <nav className="hidden md:flex items-center gap-6">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname.startsWith(item.href)
                  ? "text-primary font-bold" 
                  : "text-gray-600" 
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {
            !session?.user && (
                <div className="hidden md:flex gap-2">
                    <Button variant="ghost" asChild>
                        <Link href="/login">Connexion</Link>
                    </Button>
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary/5" asChild>
                        <Link href="/signup">S'inscrire</Link>
                    </Button>
                </div>
            )
        }
        

        {/* --- MENU MOBILE & UTILISATEUR (Regroupé) --- */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {session?.user ? (
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-8 w-8 border border-gray-200">
                        <AvatarImage src={session.user.image || ""} alt="Avatar" />
                        <AvatarFallback className="bg-pink-500/80 text-white text-xs">
                            {session.user.name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </Button> )

                :

                <Menu className=" md:hidden"/>

                }
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                
                {/* Liens de navigation uniquement pour le mobile (caché sur desktop) */}
                <div className="md:hidden">
                    {navigation.map((item) => (
                        <DropdownMenuItem key={`mobile-${item.href}`} asChild className={pathname === item.href ? "bg-accent/20" : ""}>
                            <Link href={item.href}>
                                {item.name}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                </div>
                
                {/* Menu utilisateur (toujours visible) */}
                    {session?.user &&  
                    (
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{session.user.name}</p>
                                <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                            </div>
                        </DropdownMenuLabel>
                    ) 
                }
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" /> Profil
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" /> Paramètres
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {
                    session?.user ?
                    <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" onClick={() => signOut()}>
                        <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
                    </DropdownMenuItem>:

                     (
                        <div className="gap-2">
                            <DropdownMenuItem className="font-normal" asChild>
                                <Link href="/login">Connexion</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" asChild>
                                <Link href="/signup">S'inscrire</Link>
                            </DropdownMenuItem>
                        </div>
                    )

                }
                
            </DropdownMenuContent>
        </DropdownMenu>

            

      </div>
    </header>
  );
}