import { redirect } from "next/navigation";
import { checkUser } from "@/app/actions/user";
import Link from "next/link";
import { CalendarRange, ClipboardList, ChevronRight, Calendar } from "lucide-react";

export default async function MobilePlanningPage() {
  const user = await checkUser();
  if (!user) redirect("/login");

  const items = [
    {
      title: "Planning Général",
      description: "Créneaux de service et assignations hebdomadaires",
      href: "/dashboard/user/intercessor/planning",
      icon: CalendarRange,
      gradient: "from-indigo-500 to-violet-500",
      bg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      title: "Événements Spéciaux",
      description: "Programmes et temps forts à venir",
      href: "/dashboard/user/intercessor/events",
      icon: ClipboardList,
      gradient: "from-purple-500 to-pink-500",
      bg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f6fb] pb-24">
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
          <CalendarRange className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Planning</h1>
          <p className="text-xs text-gray-400">Créneaux de prière et événements spéciaux</p>
        </div>
      </div>
      <div className="px-4 py-5 space-y-3.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group block bg-white rounded-2xl shadow-xs overflow-hidden active:scale-[0.99] transition-all border border-slate-200/70"
            >
              <div className={`h-1.5 bg-gradient-to-r ${item.gradient}`} />
              <div className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 ${item.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                  <Icon className={`h-6 w-6 ${item.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm group-hover:text-indigo-700 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                </div>
                <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </Link>
          );
        })}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3 mt-4">
          <Calendar className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
          <p className="text-xs text-indigo-700 leading-relaxed">
            Consultez le planning pour vous inscrire sur les créneaux d&apos;intercession ou suivre vos assignations.
          </p>
        </div>
      </div>
    </div>
  );
}
