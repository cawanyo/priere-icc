import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/app/actions/profile";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { SecurityForm } from "@/components/profile/SecurityForm";
import { PushNotificationCard } from "@/components/profile/PushNotificationCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { ShieldCheck, User, Lock, BellRing, ChevronLeft } from "lucide-react";

const ROLE_DISPLAY: Record<string, string> = {
  PRAYER_LEADER: "Conducteur de prière",
  INTERCESSOR: "Conducteur de prière",
  LEADER: "Responsable",
  ADMIN: "Administrateur",
  REQUESTER: "Conducteur de prière",
};

export default async function ProfilePage() {
  const user = await getCurrentUserProfile();
  if (!user) redirect("/login");

  const hasPassword = !!user.password;
  const roleLabel = ROLE_DISPLAY[user.role] ?? user.role;
  const initials = (user.name || "U").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f8fafc] py-6 md:py-8 px-4 sm:px-6 mb-10">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Lien retour mobile */}
        <Link
          href="/dashboard/mobile/espace"
          className="inline-flex md:hidden items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour
        </Link>
        
        {/* En-tête profil épuré */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border border-slate-200 shadow-xs">
              <AvatarImage src={user.image || ""} />
              <AvatarFallback className="bg-indigo-600 text-white font-bold text-base">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  {user.name || "Mon Profil"}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="h-3 w-3" />
                  {roleLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {user.email || user.phone || "Compte utilisateur"}
              </p>
            </div>
          </div>
        </div>

        {/* 1. Informations Personnelles */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Informations personnelles</h2>
              <p className="text-[11px] text-slate-400">Coordonnées associées à vos créneaux de prière.</p>
            </div>
          </div>
          <ProfileForm user={user} />
        </div>

        {/* 2. Notifications & Alertes */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
              <BellRing className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Notifications & Alertes</h2>
              <p className="text-[11px] text-slate-400">Rappels de vos créneaux et annonces importantes.</p>
            </div>
          </div>
          <PushNotificationCard />
        </div>

        {/* 3. Sécurité / Mot de passe (si compte avec mot de passe) */}
        {hasPassword && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Sécurité du compte</h2>
                <p className="text-[11px] text-slate-400">Modifier votre mot de passe de connexion.</p>
              </div>
            </div>
            <SecurityForm />
          </div>
        )}

      </div>
    </div>
  );
}
