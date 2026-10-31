import { redirect } from "next/navigation";
import { checkUser } from "@/app/actions/user";
import Link from "next/link";
import {
  CalendarClock,
  CalendarRange,
  Church,
  CircleUserRound,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignOutButton } from "@/components/profile/SignOutButton";

const ROLE_DISPLAY: Record<string, string> = {
  PRAYER_LEADER: "Conducteur de prière",
  INTERCESSOR: "Conducteur de prière",
  LEADER: "Responsable",
  ADMIN: "Administrateur",
  REQUESTER: "Conducteur de prière",
};

export default async function MobileEspacePage() {
  const user = await checkUser();
  if (!user) redirect("/login");

  const isLeader = ["LEADER", "ADMIN"].includes(user.role);
  const roleLabel = ROLE_DISPLAY[user.role] ?? user.role;
  const initials = (user.name || "U").slice(0, 2).toUpperCase();

  const serviceItems = [
    {
      title: "Mes Disponibilités",
      description: "Signaler mes absences et congés au planning",
      href: "/dashboard/user/intercessor/availability",
      icon: CalendarClock,
      iconColor: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      title: "Mon Planning",
      description: "Mes créneaux de service hebdomadaires",
      href: "/dashboard/user/intercessor/planning",
      icon: CalendarRange,
      iconColor: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Maison de Prière",
      description: "Sentinelles de nuit — 00h à 04h",
      href: "/dashboard/mobile/prayer-house",
      icon: Church,
      iconColor: "text-pink-600",
      bg: "bg-pink-50",
    },
    ...(isLeader
      ? [
          {
            title: "Espace Leader",
            description: "Gestion des plannings, événements et équipes",
            href: "/dashboard/mobile/leader",
            icon: LayoutDashboard,
            iconColor: "text-amber-600",
            bg: "bg-amber-50",
          },
        ]
      : []),
  ];

  const accountItems = [
    {
      title: "Mon Profil & Coordonnées",
      description: "Nom, téléphone, email, notifications et mot de passe",
      href: "/dashboard/user/profile",
      icon: CircleUserRound,
      iconColor: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-28">
      {/* 1. Carte d'identité utilisateur sobre */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-5 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <Avatar className="h-13 w-13 border border-slate-200 shadow-2xs shrink-0">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback className="bg-indigo-600 text-white font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-base font-bold text-slate-900 truncate">
                {user.name || "Mon Espace"}
              </h1>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                <ShieldCheck className="h-3 w-3" />
                {roleLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 truncate">
              {user.email || user.phone || "Compte membre"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* 2. Section Services & Disponibilités */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
            Service & Plannings
          </span>
          <div className="space-y-2.5">
            {serviceItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs active:scale-[0.99] transition-all hover:border-slate-300"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 ${item.bg} rounded-xl flex items-center justify-center shrink-0 border border-slate-100`}
                    >
                      <Icon className={`h-5 w-5 ${item.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 3. Section Compte & Paramètres */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
            Compte & Préférences
          </span>
          <div className="space-y-2.5">
            {accountItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs active:scale-[0.99] transition-all hover:border-slate-300"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 ${item.bg} rounded-xl flex items-center justify-center shrink-0 border border-slate-100`}
                    >
                      <Icon className={`h-5 w-5 ${item.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 4. Bouton de déconnexion */}
        <div className="pt-2">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
