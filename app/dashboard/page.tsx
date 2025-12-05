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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Quote,
  User,
  Cross
} from "lucide-react";
import { checkUser } from "../actions/user";

export default async function DashboardPage() {
  const user = await checkUser()

  if (!user) {
    redirect("/login");
  }

  
  const role = user.role;
  const userName = user?.name || "Bienvenue";
  const userImage = user?.image;

  // --- CONFIGURATION DES SECTIONS (ONGLETS) ---
  const allSections = [
    {
      id: "personal",
      label: "Mon Espace",
      icon: User,
      // Accessible à tous
      roles: ["REQUESTER", "PRAYER_LEADER", "INTERCESSOR", "LEADER", "ADMIN"],
      items: [
        {
          title: "Mes Prières",
          description: "Suivre mes requêtes et témoignages.",
          href: "/dashboard/user/prayer",
          icon: Church,
          color: "text-pink-600",
          bg: "bg-pink-50",
        },
        {
          title: "Mes Témoignages",
          description: "Partager ce que Dieu a fait.",
          href: "/dashboard/user/testimonies",
          icon: Sparkles,
          color: "text-yellow-600",
          bg: "bg-yellow-50",
        },
        {
          title: "Mon Profil",
          description: "Gérer mes infos et la sécurité.",
          href: "/dashboard/user/profile",
          icon: CircleUserRound,
          color: "text-blue-600",
          bg: "bg-blue-50",
        },
      ]
    },
    {
      id: "ministry_prayer",
      label: "Ministère",
      icon: Cross, // Ou une autre icône appropriée
      roles: ["PRAYER_LEADER"],
      items: [
        {
          title: "Événements Spéciaux",
          description: "Programmes et temps forts.",
          href: "/dashboard/user/intercessor/events",
          icon: ClipboardList,
          color: "text-purple-600",
          bg: "bg-purple-50",
          requiredRoles: ["PRAYER_LEADER", "INTERCESSOR", "LEADER", "ADMIN"],
        },
      ]
    },
    {
      id: "ministry",
      label: "Ministère",
      icon: Cross, // Ou une autre icône appropriée
      roles: ["INTERCESSOR", "LEADER", "ADMIN"],
      items: [
        {
          title: "Mon Planning",
          description: "Mes créneaux de service hebdo.",
          href: "/dashboard/user/intercessor/planning",
          icon: CalendarRange,
          color: "text-indigo-600",
          bg: "bg-indigo-50",
          requiredRoles: ["INTERCESSOR", "LEADER", "ADMIN"], // Spécifique à cet item
        },
        {
          title: "Disponibilités",
          description: "Signaler mes absences.",
          href: "/dashboard/user/intercessor/availability",
          icon: Calendar1,
          color: "text-violet-600",
          bg: "bg-violet-50",
          requiredRoles: ["INTERCESSOR", "LEADER", "ADMIN"],
        },
        {
          title: "Événements Spéciaux",
          description: "Programmes et temps forts.",
          href: "/dashboard/user/intercessor/events",
          icon: ClipboardList,
          color: "text-purple-600",
          bg: "bg-purple-50",
          requiredRoles: ["PRAYER_LEADER", "INTERCESSOR", "LEADER", "ADMIN"],
        },
      ]
    },
    {
      id: "leader",
      label: "Espace Leader",
      icon: LayoutDashboard,
      roles: ["LEADER", "ADMIN"],
      items: [
        {
          title: "Mur de Prières",
          description: "Vue globale des requêtes.",
          href: "/dashboard/leader/prayer",
          icon: LayoutDashboard,
          color: "text-orange-600",
          bg: "bg-orange-50",
        },
        {
          title: "Planification Hebdo",
          description: "Gérer le planning récurrent.",
          href: "/dashboard/leader/planning",
          icon: CalendarRange,
          color: "text-amber-600",
          bg: "bg-amber-50",
        },
        {
          title: "Gestion Événements",
          description: "Créer des temps forts.",
          href: "/dashboard/leader/events",
          icon: ClipboardList,
          color: "text-yellow-600",
          bg: "bg-yellow-50",
        },
        {
          title: "Équipe",
          description: "Gérer les membres et recrutements.",
          href: "/dashboard/leader/team",
          icon: Users,
          color: "text-rose-600",
          bg: "bg-rose-50",
        },
      ]
    },
    {
      id: "admin",
      label: "Administration",
      icon: ShieldCheck,
      roles: ["ADMIN"],
      items: [
        {
          title: "Utilisateurs",
          description: "Gestion système.",
          href: "/dashboard/admin/users",
          icon: ShieldCheck,
          color: "text-red-600",
          bg: "bg-red-50",
        },
      ]
    },
  ];

  // Filtrer les sections accessibles
  const availableSections = allSections.filter(section => 
    section.roles.includes(role)
  );

  return (
    <div className="min-h-screen bg-gray-50/30">
      
      {/* --- HERO HEADER --- */}
      <div className="bg-white border-b border-gray-100 pb-16 pt-8 px-4 md:px-8 relative overflow-hidden">
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

          {/* Citation */}
          <div className="hidden lg:block max-w-md bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-sm italic text-gray-600 text-sm relative">
            <Quote className="h-8 w-8 text-indigo-100 absolute -top-3 -left-3 rotate-180" />
            "La prière fervente du juste a une grande efficacité."
            <span className="block text-right font-semibold text-indigo-900 not-italic mt-1 text-xs">— Jacques 5:16</span>
          </div>
        </div>
      </div>

      {/* --- TABS CONTENT --- */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 -mt-10 relative z-10">
        <Tabs defaultValue={availableSections[0]?.id || "personal"} className="space-y-8">
            
            {/* Liste des onglets */}
            <div className="w-full ">
                <TabsList className="bg-white/80 backdrop-blur border shadow-sm h-auto p-1 gap-1 w-full md:rounded-full flex flex-wrap">
                    {availableSections.map((section) => (
                        <TabsTrigger 
                            key={section.id} 
                            value={section.id}
                            className="rounded-full px-4 py-2 md:px-6 md:py-2.5 text-xs md:text-sm data-[state=active]:bg-indigo-900 data-[state=active]:text-white transition-all flex items-center whitespace-nowrap"
                        >
                            <section.icon className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2 shrink-0" />
                            {section.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>

            {/* Contenu des onglets */}
            {availableSections.map((section) => (
                <TabsContent key={section.id} value={section.id} className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {section.items
                            .map((card) => (
                            <Link key={card.href} href={card.href} className="group block h-full">
                                <Card className="h-full border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group-hover:border-indigo-100 bg-white">
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
                </TabsContent>
            ))}
        </Tabs>
      </div>
    </div>
  );
}