import { redirect } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CalendarRange, ClipboardList, CheckCircle2,
  Moon, Clock, ChevronRight, Star, Home,
  Sparkles, Quote, TrendingUp, Heart,
  Activity, CalendarCheck, Church,
} from "lucide-react";
import { checkUser } from "../actions/user";
import { getUserDashboard } from "../actions/dashboard-home";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function DashboardPage() {
  const user = await checkUser();
  if (!user) redirect("/login");

  const role = user.role;
  const userName = user?.name || "Bienvenue";
  const userImage = user?.image;

  const dashboardData = await getUserDashboard();
  const daySchedules = dashboardData?.daySchedules || [];
  const nightSchedules = dashboardData?.nightSchedules || [];
  const servicesThisMonth = dashboardData?.servicesThisMonth ?? 0;
  const upcomingEvents = dashboardData?.upcomingEvents || [];
  const recentTestimonies = dashboardData?.recentTestimonies || [];
  const currentNightWatch = dashboardData?.currentNightWatch;

  const upcomingSchedules = [...daySchedules, ...nightSchedules]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const quickLinks = [
    { href: "/dashboard/desktop/checkin", label: "Check-in", icon: Heart, color: "text-rose-500", bg: "bg-rose-50" },
    { href: "/dashboard/desktop/rdv", label: "Rendez-vous", icon: CalendarCheck, color: "text-violet-500", bg: "bg-violet-50" },
    { href: "/dashboard/desktop/planning", label: "Planning", icon: CalendarRange, color: "text-indigo-500", bg: "bg-indigo-50" },
    { href: "/dashboard/desktop/prayer-house", label: "Maison de Prière", icon: Church, color: "text-pink-500", bg: "bg-pink-50" },
  ];

  return (
    <>
      {/* ── VERSION DESKTOP ── */}
      <div className="hidden md:block min-h-screen bg-[#f4f6fb]">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Bonjour, {userName.split(" ")[0]} 👋
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              Heureux de vous revoir sur l'espace de prière.
            </p>
          </div>
          <div className="hidden lg:block max-w-sm bg-indigo-50 rounded-2xl px-4 py-2.5 italic text-indigo-700 text-xs relative">
            <Quote className="h-5 w-5 text-indigo-200 absolute -top-1.5 -left-1.5 rotate-180" />
            "La prière fervente du juste a une grande efficacité."
            <span className="block text-right font-semibold not-italic mt-0.5 text-[10px] text-indigo-500">— Jacques 5:16</span>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6 max-w-6xl">

          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: servicesThisMonth, label: "Services ce mois", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
              { value: upcomingSchedules.length, label: "Planifiés à venir", icon: CalendarRange, color: "text-indigo-600", bg: "bg-indigo-50" },
              { value: upcomingEvents.length, label: "Événements", icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
            ].map(({ value, label, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
                <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center shrink-0`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-gray-800">{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Accès rapides */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Accès rapide</p>
            <div className="grid grid-cols-4 gap-3">
              {quickLinks.map(({ href, label, icon: Icon, color, bg }) => (
                <Link key={href} href={href} className="group bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-indigo-700 text-center">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Contenu principal en 2 colonnes */}
          <div className="grid grid-cols-3 gap-5">

            {/* Colonne gauche — 2/3 */}
            <div className="col-span-2 space-y-5">

              {/* Prochains services */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-1 h-4 bg-indigo-500 rounded-full block" />
                    Prochains services
                  </h2>
                </div>
                {upcomingSchedules.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingSchedules.map((schedule, i) => {
                      const isNight = "startTime" in schedule;
                      return (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isNight ? "bg-violet-100" : "bg-indigo-100"}`}>
                            {isNight ? <Moon className="h-4 w-4 text-violet-500" /> : <Clock className="h-4 w-4 text-indigo-500" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800"> De service </p>
                            <p className="text-xs text-gray-400 capitalize">
                              {format(new Date(schedule.date), "EEEE d MMMM yyyy", { locale: fr })}
                              {isNight && "startTime" in schedule ? ` · ${schedule.startTime}–${schedule.endTime}` : ""}
                            </p>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarRange className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Aucun service planifié</p>
                  </div>
                )}
              </div>

              {/* Événements à venir */}
              {upcomingEvents.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <span className="w-1 h-4 bg-pink-500 rounded-full block" />
                    Événements à venir
                  </h2>
                  <div className="space-y-2">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-all">
                        <div className="w-9 h-9 bg-pink-100 rounded-xl flex items-center justify-center shrink-0">
                          <ClipboardList className="h-4 w-4 text-pink-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{event.title}</p>
                          <p className="text-xs text-gray-400 capitalize">
                            {format(new Date(event.startDate), "EEEE d MMM yyyy", { locale: fr })}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Colonne droite — 1/3 */}
            <div className="space-y-5">

              {/* Maison de garde */}
              {currentNightWatch && (
                <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl p-5 text-white shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                      <Home className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] text-violet-200 uppercase font-bold tracking-wide">Cette semaine</p>
                      <p className="font-bold text-sm">{currentNightWatch.prayerFamily.name}</p>
                    </div>
                  </div>
                  {currentNightWatch.schedules.length > 0 ? (
                    <div className="space-y-1.5">
                      {currentNightWatch.schedules.slice(0, 4).map((s) => (
                        <div key={s.id} className="flex items-center justify-between bg-white/15 rounded-xl px-3 py-1.5">
                          <span className="text-xs font-mono text-violet-200">{s.startTime}</span>
                          <span className="text-xs font-medium text-white">{s.user?.name ?? "Non assigné"}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-violet-200">Aucun créneau aujourd'hui</p>
                  )}
                  <Link href="/dashboard/desktop/prayer-house" className="mt-4 flex items-center gap-1.5 text-xs text-violet-200 hover:text-white font-semibold transition-colors">
                    Voir tout <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {/* Témoignages récents */}
              {recentTestimonies.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <span className="w-1 h-4 bg-yellow-400 rounded-full block" />
                      Témoignages
                    </h2>
                    <Link href="/testimonies" className="text-xs text-indigo-500 font-medium hover:text-indigo-700">Voir tout</Link>
                  </div>
                  <div className="space-y-3">
                    {recentTestimonies.slice(0, 3).map((t) => (
                      <div key={t.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-xl flex items-center justify-center shrink-0 text-sm">✨</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800">{t.name}</p>
                          {t.content && <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">{t.content}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accès Mon Espace */}
              <div className="bg-white rounded-2xl shadow-sm p-5 space-y-2">
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                  <span className="w-1 h-4 bg-blue-400 rounded-full block" />
                  Mon Espace
                </h2>
                {[
                  { href: "/dashboard/user/prayer", label: "Mes Prières", color: "text-pink-500" },
                  { href: "/dashboard/user/testimonies", label: "Mes Témoignages", color: "text-yellow-500" },
                  { href: "/dashboard/user/profile", label: "Mon Profil", color: "text-blue-500" },
                ].map(({ href, label, color }) => (
                  <Link key={href} href={href} className="flex items-center justify-between text-sm text-gray-600 hover:text-indigo-700 py-1.5 px-2 rounded-xl hover:bg-gray-50 transition-all">
                    <span className={`font-medium ${color}`}>{label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── VERSION MOBILE (inchangée) ── */}
      <div className="md:hidden min-h-screen bg-[#f4f6fb] pb-24">
        <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 px-5 pt-6 pb-16 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
          <div className="absolute top-16 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-violet-400/30 rounded-full" />
          <div className="relative flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-13 w-13 border-[3px] border-white/80 shadow-lg" style={{height:'52px',width:'52px'}}>
                  <AvatarImage src={userImage || ""} />
                  <AvatarFallback className="bg-indigo-300 text-white font-bold text-base">
                    {userName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white block" />
              </div>
              <div>
                <p className="text-indigo-200 text-xs font-medium">Bienvenue</p>
                <h1 className="text-white text-xl font-bold leading-tight">{userName.split(" ")[0]} 👋</h1>
              </div>
            </div>
          </div>
          <div className="relative grid grid-cols-3 gap-3">
            {[
              { value: servicesThisMonth, label: "Services\nce mois", icon: CheckCircle2 },
              { value: upcomingSchedules.length, label: "Planifiés\nà venir", icon: CalendarRange },
              { value: upcomingEvents.length, label: "Événements\nà venir", icon: Star },
            ].map(({ value, label, icon: Icon }, i) => (
              <div key={i} className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20">
                <Icon className="h-4 w-4 text-white/70 mx-auto mb-1" />
                <div className="text-2xl font-extrabold text-white leading-none">{value}</div>
                <div className="text-[10px] text-indigo-200 mt-1 whitespace-pre-line leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-4 -mt-6 space-y-4">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1 h-4 bg-indigo-500 rounded-full block" />
                Prochains services
              </h2>
            </div>
            {upcomingSchedules.length > 0 ? (
              <div className="space-y-2.5">
                {upcomingSchedules.slice(0, 3).map((schedule, index) => {
                  const isNight = "startTime" in schedule;
                  return (
                    <div key={index} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isNight ? "bg-violet-100" : "bg-indigo-100"}`}>
                        {isNight ? <Moon className="h-5 w-5 text-violet-500" /> : <Clock className="h-5 w-5 text-indigo-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 leading-tight">
                          De service
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 capitalize">
                          {format(new Date(schedule.date), "EEEE d MMMM", { locale: fr })}
                          {isNight && "startTime" in schedule ? ` · ${schedule.startTime}–${schedule.endTime}` : ""}
                        </p>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-5 text-center shadow-sm">
                <CalendarRange className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Aucun service planifié à venir</p>
              </div>
            )}
          </section>
          {currentNightWatch && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-1 h-4 bg-violet-500 rounded-full block" />
                  Maison de garde
                </h2>
                <Link href="/dashboard/desktop/prayer-house" className="text-xs text-indigo-500 font-medium flex items-center gap-0.5">
                  Voir <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl p-4 shadow-md text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    <Home className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-violet-200 uppercase font-semibold tracking-wide">Cette semaine</p>
                    <p className="font-bold text-sm leading-tight">{currentNightWatch.prayerFamily.name}</p>
                  </div>
                </div>
                {currentNightWatch.schedules.length > 0 ? (
                  <div className="space-y-1.5">
                    {currentNightWatch.schedules.slice(0, 3).map((s) => (
                      <div key={s.id} className="flex items-center justify-between bg-white/15 rounded-xl px-3 py-1.5">
                        <span className="text-xs font-mono text-violet-200">{s.startTime}</span>
                        <span className="text-xs font-medium text-white">{s.user?.name ?? "Non assigné"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-violet-200">Aucun créneau pour aujourd'hui</p>
                )}
              </div>
            </section>
          )}
          {upcomingEvents.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-1 h-4 bg-pink-500 rounded-full block" />
                  Événements à venir
                </h2>
              </div>
              <div className="space-y-2.5">
                {upcomingEvents.map((event) => (
                  <Link key={event.id}  href={`http://localhost:3000/dashboard/user/intercessor/events/${event.id}`}>
                    <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center shrink-0">
                        <ClipboardList className="h-5 w-5 text-pink-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-1">{event.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 capitalize">
                          {format(new Date(event.startDate), "EEEE d MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {recentTestimonies.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-1 h-4 bg-yellow-400 rounded-full block" />
                  Témoignages récents
                </h2>
                <Link href="/testimonies" className="text-xs text-indigo-500 font-medium flex items-center gap-0.5">
                  Voir tout <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-2.5">
                {recentTestimonies.map((t) => (
                  <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-yellow-100 rounded-xl flex items-center justify-center shrink-0">
                        <span className="h-4 w-4 text-yellow-500">✨</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 leading-tight">{t.name}</p>
                        {t.content && <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{t.content}</p>}
                        <p className="text-[10px] text-gray-300 mt-1.5">
                          {format(new Date(t.createdAt), "d MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
