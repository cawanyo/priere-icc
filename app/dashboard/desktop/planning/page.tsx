import { redirect } from "next/navigation";
import { checkUser } from "@/app/actions/user";
import Link from "next/link";
import { CalendarRange, ClipboardList, ChevronRight, Sparkles } from "lucide-react";

export default async function DesktopPlanningPage() {
  const user = await checkUser();
  if (!user) redirect("/login");

  const role = user.role;
  const canSeePlanning = [ "INTERCESSOR", "LEADER", "ADMIN"].includes(role);
  const canSeeEvents   = ["PRAYER_LEADER", "INTERCESSOR", "LEADER", "ADMIN"].includes(role);

  const items = [
    ...(canSeePlanning ? [{
      title: "Mon Planning",
      description: "Mes créneaux de service hebdomadaires",
      href: "/dashboard/user/intercessor/planning",
      icon: CalendarRange,
      gradient: "from-indigo-500 to-violet-500",
      bg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    }] : []),
    ...(canSeeEvents ? [{
      title: "Événements Spéciaux",
      description: "Programmes et temps forts à venir",
      href: "/dashboard/user/intercessor/events",
      icon: ClipboardList,
      gradient: "from-purple-500 to-pink-500",
      bg: "bg-purple-50",
      iconColor: "text-purple-600",
    }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
          <CalendarRange className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Planning</h1>
          <p className="text-xs text-gray-400">Mes créneaux et événements spéciaux</p>
        </div>
      </div>
      <div className="px-8 py-6 max-w-3xl space-y-4">
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <CalendarRange className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Aucun planning disponible pour votre rôle.</p>
          </div>
        ) : (
          items.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="group block bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className={`h-1.5 bg-gradient-to-r ${item.gradient}`} />
                <div className="p-5 flex items-center gap-5">
                  <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                    <Icon className={`h-7 w-7 ${item.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-base group-hover:text-indigo-700 transition-colors">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                  </div>
                  <div className="w-9 h-9 bg-gray-50 group-hover:bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 transition-all">
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
        {items.length > 0 && (
          <div className="bg-indigo-50 rounded-2xl p-4 flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
            <p className="text-xs text-indigo-600 leading-relaxed">
              Consulte ton planning régulièrement pour rester à jour sur tes créneaux de service.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
