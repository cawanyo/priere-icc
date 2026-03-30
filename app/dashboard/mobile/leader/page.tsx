import { redirect } from "next/navigation";
import { checkUser } from "@/app/actions/user";
import Link from "next/link";
import {
  LayoutDashboard,
  CalendarRange,
  ClipboardList,
  Users,
  Home,
  ArrowRight,
  Activity,
  CalendarCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function MobileLeaderPage() {
  const user = await checkUser();
  if (!user) redirect("/login");

  if (!["LEADER", "ADMIN"].includes(user.role)) {
    redirect("/dashboard");
  }

  const items = [
    {
      title: "Suivi des Stars",
      description: "Santé spirituelle de l'équipe.",
      href: "/dashboard/mobile/leader/checkins",
      icon: Activity,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      highlight: true,
    },
    {
      title: "Mes Rendez-vous",
      description: "Disponibilités et RDV avec l'équipe.",
      href: "/dashboard/mobile/leader/rdv",
      icon: CalendarCheck,
      color: "text-violet-600",
      bg: "bg-violet-50",
      highlight: true,
    },
    {
      title: "Mur de Prières",
      description: "Vue globale des requêtes.",
      href: "/dashboard/leader/prayer",
      icon: LayoutDashboard,
      color: "text-orange-600",
      bg: "bg-orange-50",
      highlight: false,
    },
    {
      title: "Planification Hebdo",
      description: "Gérer le planning récurrent.",
      href: "/dashboard/leader/planning",
      icon: CalendarRange,
      color: "text-amber-600",
      bg: "bg-amber-50",
      highlight: false,
    },
    {
      title: "Maison de Prière",
      description: "Planning des sentinelles.",
      href: "/dashboard/leader/prayer-house",
      icon: Home,
      color: "text-purple-600",
      bg: "bg-purple-50",
      highlight: false,
    },
    {
      title: "Gestion Événements",
      description: "Créer et gérer les temps forts.",
      href: "/dashboard/leader/events",
      icon: ClipboardList,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      highlight: false,
    },
    {
      title: "Équipe",
      description: "Gérer les membres et recrutements.",
      href: "/dashboard/leader/team",
      icon: Users,
      color: "text-rose-600",
      bg: "bg-rose-50",
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f6fb] pb-24">

      {/* Header */}
      <div className=" bg-gradient-to-br from-indigo-700 to-violet-700 px-5 pt-6 pb-12 overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
        <LayoutDashboard className="text-white/20 absolute bottom-3 right-5 h-14 w-14" />
        <h1 className="text-white text-xl font-bold relative">Espace Leader</h1>
        <p className="text-indigo-200 text-xs mt-0.5 relative">Pilotage et gestion</p>
      </div>

      <div className="px-4 -mt-6 space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="block group">
              <Card className={`shadow-sm transition-all duration-200 ${item.highlight ? "border-indigo-200 ring-1 ring-indigo-200" : "border-gray-100 hover:border-indigo-100"}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-11 h-11 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm group-hover:text-indigo-900 transition-colors ${item.highlight ? "text-indigo-700" : "text-gray-800"}`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-400 transition-colors shrink-0" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
