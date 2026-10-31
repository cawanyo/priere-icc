import { redirect } from "next/navigation";
import { checkUser } from "@/app/actions/user";
import Link from "next/link";
import {
  CalendarClock,
  CircleUserRound,
  ChevronRight,
  ShieldCheck,
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

export default async function DesktopEspacePage() {
  const user = await checkUser();
  if (!user) redirect("/login");

  const roleLabel = ROLE_DISPLAY[user.role] ?? user.role;
  const initials = (user.name || "U").slice(0, 2).toUpperCase();

  const items = [
    {
      title: "Mes indisponibilités",
      description: "Signaler mes absences ou congés pour le planning de prière.",
      href: "/dashboard/user/intercessor/availability",
      icon: CalendarClock,
      iconColor: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      title: "Compte et référence",
      description: "Gérer mes coordonnées personnelles, téléphone et mot de passe.",
      href: "/dashboard/user/profile",
      icon: CircleUserRound,
      iconColor: "text-indigo-600",
      bg: "bg-indigo-50",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Entête sobre */}
      <div className="bg-white border-b border-slate-200/80 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <Avatar className="h-12 w-12 border border-slate-200 shadow-2xs">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback className="bg-indigo-600 text-white font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{user.name || "Mon Espace"}</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="h-3 w-3" />
                {roleLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {user.email || user.phone || "Espace membre"}
            </p>
          </div>
        </div>

        <div className="w-48">
          <SignOutButton />
        </div>
      </div>

      <div className="px-8 py-8 max-w-3xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center gap-4 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all hover:-translate-y-0.5"
              >
                <div
                  className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center shrink-0 border border-slate-100`}
                >
                  <Icon className={`h-6 w-6 ${item.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-sm">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 shrink-0 transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
