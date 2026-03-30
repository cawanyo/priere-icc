import { redirect } from "next/navigation";
import { checkUser } from "@/app/actions/user";
import Link from "next/link";
import {
  Church,
  Sparkles,
  Calendar1,
  CircleUserRound,
  ArrowRight,
  HeartPulse,
  CalendarCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default async function MobileEspacePage() {
  const user = await checkUser();
  if (!user) redirect("/login");

  const isMinistere = ["INTERCESSOR", "PRAYER_LEADER", "LEADER", "ADMIN"].includes(user.role);

  const items = [

     // {
    //   href: "/dashboard/mobile/checkin",
    //   label: "Check-in",
    //   icon: HeartPulse,
    //   show: true,
    //   active: pathname.startsWith("/dashboard/mobile/checkin"),
    // },
    // {
    //   href: "/dashboard/mobile/rdv",
    //   label: "RDV",
    //   icon: CalendarCheck,
    //   show: true,
    //   active: pathname.startsWith("/dashboard/mobile/rdv"),
    // },
    {
      title: "Check-in",
      description: "Suivre mon etat de santé à la fois physique, emotionnelle et spirituelle.",
      href: "/dashboard/mobile/checkin",
      icon: HeartPulse,
      color: "text-pink-600",
      bg: "bg-pink-50",
      show: isMinistere,
    },

    {
      title: "RDV",
      description: "Prendre rdv avec le pasteur ou un Leader.", 
      href: "/dashboard/mobile/rdv",
      icon: CalendarCheck,
      color: "text-pink-600",
      bg: "bg-pink-50",
      show: true,
    },

    {
      title: "Mes Prières",
      description: "Suivre mes requêtes et leur statut.",
      href: "/dashboard/user/prayer",
      icon: Church,
      color: "text-pink-600",
      bg: "bg-pink-50",
      show: true,
    },
    {
      title: "Mes Témoignages",
      description: "Partager ce que Dieu a fait.",
      href: "/dashboard/user/testimonies",
      icon: Sparkles,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      show: true,
    },
    {
      title: "Disponibilités",
      description: "Signaler mes absences au planning.",
      href: "/dashboard/user/intercessor/availability",
      icon: Calendar1,
      color: "text-violet-600",
      bg: "bg-violet-50",
      show: isMinistere,
    },
    {
      title: "Mon Profil",
      description: "Gérer mes informations personnelles.",
      href: "/dashboard/user/profile",
      icon: CircleUserRound,
      color: "text-blue-600",
      bg: "bg-blue-50",
      show: true,
    },
  ].filter((item) => item.show);

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <CircleUserRound className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-indigo-900">Mon Espace</h1>
            <p className="text-xs text-muted-foreground">Prières, témoignages et profil</p>
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="block group">
                <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:border-indigo-100">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div
                      className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}
                    >
                      <Icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 group-hover:text-indigo-900 transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
