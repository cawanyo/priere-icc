import { redirect } from "next/navigation";
import { checkUser } from "@/app/actions/user";
import Link from "next/link";
import {
  Church, Sparkles, Calendar1, CircleUserRound, ChevronRight,
} from "lucide-react";

export default async function DesktopEspacePage() {
  const user = await checkUser();
  if (!user) redirect("/login");

  const isMinistere = ["INTERCESSOR", "PRAYER_LEADER", "LEADER", "ADMIN"].includes(user.role);

  const items = [
    { title: "Mes Prières", description: "Suivre mes requêtes et leur statut.", href: "/dashboard/user/prayer", icon: Church, color: "text-pink-600", bg: "bg-pink-50", show: true },
    { title: "Mes Témoignages", description: "Partager ce que Dieu a fait.", href: "/dashboard/user/testimonies", icon: Sparkles, color: "text-yellow-600", bg: "bg-yellow-50", show: true },
    { title: "Disponibilités", description: "Signaler mes absences au planning.", href: "/dashboard/user/intercessor/availability", icon: Calendar1, color: "text-violet-600", bg: "bg-violet-50", show: isMinistere },
    { title: "Mon Profil", description: "Gérer mes informations personnelles.", href: "/dashboard/user/profile", icon: CircleUserRound, color: "text-blue-600", bg: "bg-blue-50", show: true },
  ].filter((i) => i.show);

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
          <CircleUserRound className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Mon Espace</h1>
          <p className="text-xs text-gray-400">Prières, témoignages et profil</p>
        </div>
      </div>
      <div className="px-8 py-6 max-w-3xl">
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="group bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className={`w-12 h-12 ${item.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                  <Icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-400 shrink-0 transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
