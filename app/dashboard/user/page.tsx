import { getUserDashboard } from "@/app/actions/dashboard-home";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Clock, Moon, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function UserDashboardPage() {
  const data = await getUserDashboard();

  if (!data) return <div>Chargement...</div>;
  const { user, daySchedules, nightSchedules } = data;

  return (
    <div className="flex-1 p-6 space-y-6 bg-gray-50/30 min-h-screen">
        {/* Header avec bienvenue */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-serif font-bold text-indigo-900">
                    Bonjour {user.name?.split(" ")[0]} 👋
                </h2>
                <p className="text-gray-500">Prêt à servir dans la prière ?</p>
            </div>
            
            {user.prayerFamily ? (
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border shadow-sm">
                    <Shield className="h-5 w-5 text-indigo-600" />
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold">Ma Famille</p>
                        <p className="text-sm font-bold text-gray-800">{user.prayerFamily.name}</p>
                    </div>
                </div>
            ) : (
                <Button asChild variant="outline" size="sm" className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
                    <Link href="/dashboard/user/prayer-house">Rejoindre une famille</Link>
                </Button>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Prochains Services de Nuit */}
            <Card className="border-t-4 border-t-indigo-500 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Moon className="h-5 w-5 text-indigo-500" />
                        Mes Tours de Garde (Nuit)
                    </CardTitle>
                    <CardDescription>Vos prochains créneaux 00h-04h</CardDescription>
                </CardHeader>
                <CardContent>
                    {nightSchedules.length > 0 ? (
                        <div className="space-y-3">
                            {nightSchedules.map((s: any) => (
                                <div key={s.id} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-indigo-900 capitalize">
                                            {format(new Date(s.date), "EEEE d MMMM", { locale: fr })}
                                        </span>
                                        <span className="text-xs text-indigo-600">
                                            Semaine {s.assignment.family.name}
                                        </span>
                                    </div>
                                    <div className="bg-white px-3 py-1 rounded shadow-sm text-sm font-bold font-mono text-indigo-800">
                                        {s.startTime}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-400">
                            <p>Aucun service de nuit à venir.</p>
                            <Button asChild variant="link" className="text-indigo-600">
                                <Link href="/dashboard/user/prayer-house">S'inscrire au planning</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 2. Prochains Services de Jour */}
            <Card className="border-t-4 border-t-pink-500 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5 text-pink-500" />
                        Programme Général
                    </CardTitle>
                    <CardDescription>Vos assignations sur les événements</CardDescription>
                </CardHeader>
                <CardContent>
                    {daySchedules.length > 0 ? (
                        <div className="space-y-3">
                            {daySchedules.map((s: any) => (
                                <div key={s.id} className="flex items-center justify-between p-3 bg-pink-50 rounded-lg border border-pink-100">
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="font-bold text-gray-800 truncate">{s.title}</span>
                                        <span className="text-xs text-gray-500 capitalize">
                                            {format(new Date(s.date), "EEEE d MMM", { locale: fr })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-gray-600 bg-white px-2 py-1 rounded border">
                                        <Clock className="h-3 w-3" />
                                        {s.startTime}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-400">
                            <p>Aucun service planifié.</p>
                            <Button asChild variant="link" className="text-pink-600">
                                <Link href="/dashboard/user/intercessor/events">Voir le calendrier</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    </div>
  );
}