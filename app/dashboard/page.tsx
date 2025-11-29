// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Church,
  CircleUserRound,
  CalendarRange,
  Calendar1,
  ClipboardList,
  Users,
  ShieldCheck,
  ArrowRight,
  LayoutDashboard,
  Sparkles,
  Quote
} from "lucide-react";
import { checkUser } from "../actions/user";

export default async function DashboardPage() {
  const user = await checkUser();

  if (!user) {
    redirect("/login");
  }


  const role = user?.role;

  const userName = user?.name || "Bienvenue";
 
  const userImage = user?.image;

  // Configuration des cartes
  const allCards = [
    // --- SECTION PERSONNELLE ---
    {
      section: "Mon Espace",
      items: [
        {
          title: "Mes Prières",
          description: "Suivre mes requêtes et témoignages.",
          href: "/dashboard/user/prayer",
          icon: Church,
          color: "text-pink-600",
          bg: "bg-pink-50",
          roles: ["REQUESTER", "INTERCESSOR", "LEADER", "ADMIN"],
        },
        {
          title: "Mon Profil",
          description: "Gérer mes infos et la sécurité.",
          href: "/dashboard/user/profile",
          icon: CircleUserRound,
          color: "text-blue-600",
          bg: "bg-blue-50",
          roles: ["REQUESTER", "INTERCESSOR", "LEADER", "ADMIN"],
        },
      ]
    },

    // --- SECTION INTERCESSEUR ---
    {
      section: "Ministère d'Intercession",
      items: [
        {
          title: "Mon Planning",
          description: "Mes créneaux de service.",
          href: "/dashboard/user/intercessor/planning",
          icon: CalendarRange,
          color: "text-indigo-600",
          bg: "bg-indigo-50",
          roles: ["INTERCESSOR", "LEADER", "ADMIN"],
        },
        {
          title: "Disponibilités",
          description: "Signaler mes absences.",
          href: "/dashboard/user/intercessor/availability",
          icon: Calendar1,
          color: "text-violet-600",
          bg: "bg-violet-50",
          roles: ["INTERCESSOR", "LEADER", "ADMIN"],
        },
        {
          title: "Événements",
          description: "Programmes spéciaux.",
          href: "/dashboard/user/intercessor/events",
          icon: ClipboardList,
          color: "text-purple-600",
          bg: "bg-purple-50",
          roles: ["INTERCESSOR", "LEADER", "ADMIN"],
        },
      ]
    },

    // --- SECTION LEADER ---
    {
      section: "Espace Leader",
      items: [
        {
          title: "Mur de Prières",
          description: "Vue globale des requêtes.",
          href: "/dashboard/leader/prayer",
          icon: LayoutDashboard,
          color: "text-orange-600",
          bg: "bg-orange-50",
          roles: ["LEADER", "ADMIN"],
        },
        {
          title: "Planification",
          description: "Gérer le planning hebdo.",
          href: "/dashboard/leader/planning",
          icon: CalendarRange,
          color: "text-amber-600",
          bg: "bg-amber-50",
          roles: ["LEADER", "ADMIN"],
        },
        {
          title: "Gestion Événements",
          description: "Créer des temps forts.",
          href: "/dashboard/leader/events",
          icon: ClipboardList,
          color: "text-yellow-600",
          bg: "bg-yellow-50",
          roles: ["LEADER", "ADMIN"],
        },
        {
          title: "Équipe",
          description: "Gérer les membres.",
          href: "/dashboard/leader/team",
          icon: Users,
          color: "text-rose-600",
          bg: "bg-rose-50",
          roles: ["LEADER", "ADMIN"],
        },
      ]
    },

    // --- SECTION ADMIN ---
    {
      section: "Administration",
      items: [
        {
          title: "Utilisateurs",
          description: "Gestion système.",
          href: "/dashboard/admin/users",
          icon: ShieldCheck,
          color: "text-red-600",
          bg: "bg-red-50",
          roles: ["ADMIN"],
        },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/30">
      
      {/* --- HERO HEADER --- */}
      <div className="bg-white border-b border-gray-100 pb-12 pt-8 px-4 md:px-8 relative overflow-hidden">
        {/* Décoration d'arrière-plan subtile */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-50 to-indigo-50 rounded-full blur-3xl opacity-50 -z-10" />
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                    <AvatarImage src={userImage || ""} />
                    <AvatarFallback className="text-xl bg-indigo-100 text-indigo-700 font-bold">
                        {userName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 bg-green-500 w-5 h-5 rounded-full border-4 border-white"></div>
            </div>
            <div>
                <h1 className="text-3xl font-serif font-bold text-indigo-950">
                    Bonjour, {userName.split(' ')[0]}
                </h1>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Sparkles className="h-4 w-4 text-yellow-500" /> 
                    Heureux de vous revoir sur l'espace de prière.
                </p>
            </div>
          </div>

          {/* Citation du jour (Statique pour l'instant) */}
          <div className="hidden lg:block max-w-md bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-sm italic text-gray-600 text-sm relative">
            <Quote className="h-8 w-8 text-indigo-100 absolute -top-3 -left-3 rotate-180" />
            "La prière fervente du juste a une grande efficacité."
            <span className="block text-right font-semibold text-indigo-900 not-italic mt-1 text-xs">— Jacques 5:16</span>
          </div>
        </div>
      </div>

      {/* --- GRID CONTENT --- */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10 -mt-6">
        
        {allCards.map((section, idx) => {
            // Filtrer les items de la section selon le rôle
            const visibleItems = section.items.filter(item => item.roles.includes(role));
            
            if (visibleItems.length === 0) return null;

            return (
                <div key={idx} className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-500 uppercase tracking-wider pl-1">
                        {section.section}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {visibleItems.map((card) => (
                            <Link key={card.href} href={card.href} className="group block h-full">
                                <Card className="h-full border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group-hover:border-indigo-100">
                                    <div className={`absolute top-0 right-0 w-24 h-24 ${card.bg} rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110`} />
                                    
                                    <CardHeader className="pb-2 relative">
                                        <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center mb-4 transition-colors group-hover:bg-white group-hover:shadow-sm`}>
                                            <card.icon className={`h-6 w-6 ${card.color}`} />
                                        </div>
                                        <CardTitle className="text-lg font-bold text-gray-800 group-hover:text-indigo-900 transition-colors">
                                            {card.title}
                                        </CardTitle>
                                    </CardHeader>
                                    
                                    <CardContent>
                                        <CardDescription className="text-gray-500 mb-4 line-clamp-2">
                                            {card.description}
                                        </CardDescription>
                                        
                                        <div className="flex items-center text-sm font-medium text-indigo-600 opacity-0 transform translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                            Accéder <ArrowRight className="ml-2 h-4 w-4" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}