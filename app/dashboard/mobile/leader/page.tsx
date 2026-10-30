import { redirect } from "next/navigation";
import { checkUser } from "@/app/actions/user";
import Link from "next/link";
import {
  CalendarRange,
  CalendarDays,
  Users,
  Moon,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export default async function MobileLeaderPage() {
  const user = await checkUser();
  if (!user) redirect("/login");

  if (!["LEADER", "ADMIN"].includes(user.role)) {
    redirect("/dashboard");
  }

  const items = [
    {
      title: "Planning de Prière",
      description: "Coordination des créneaux hebdomadaires",
      href: "/dashboard/leader/planning",
      icon: CalendarRange,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Maison de Prière",
      description: "Familles de sentinelles de la nuit (00h - 04h)",
      href: "/dashboard/leader/prayer-house",
      icon: Moon,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Événements Spéciaux",
      description: "Organisation des temps forts et séminaires",
      href: "/dashboard/leader/events",
      icon: CalendarDays,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Équipe de Prière",
      description: "Gestion des conducteurs et intercesseurs",
      href: "/dashboard/leader/team",
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-5 pb-28 space-y-5">
      {/* En-tête sobre et soigné */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
        <div className="h-11 w-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">Espace Leader</h1>
          <p className="text-xs text-slate-500 mt-0.5">Pilotage et supervision du ministère</p>
        </div>
      </div>

      {/* Cartes d'accès rapide */}
      <div className="space-y-2.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {item.description}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0 ml-2" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
