import { getLeaderStats } from "@/app/actions/dashboard-home";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Moon, ArrowRight, ShieldCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default async function LeaderDashboardPage() {
  const { nextEvent, nightWatch, stats } = await getLeaderStats();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <div className="flex-1 p-8 pt-6 space-y-8 bg-gray-50/30 min-h-screen">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight text-indigo-900">
          Vue d'ensemble
        </h2>
        <p className="text-muted-foreground">Bienvenue sur votre espace de pilotage.</p>
      </div>

      {/* 1. KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intercesseurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeIntercessors}</div>
            <p className="text-xs text-muted-foreground">Actifs sur la plateforme</p>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Familles de Prière</CardTitle>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.totalFamilies}</div>
                <p className="text-xs text-muted-foreground">Maisons opérationnelles</p>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* 2. Prochain Grand Événement */}
        <Card className="col-span-4 border-l-4 border-l-pink-500">
          <CardHeader>
            <CardTitle>Prochain Événement Spécial</CardTitle>
          </CardHeader>
          <CardContent>
            {nextEvent ? (
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">{nextEvent.title}</h3>
                        <p className="text-gray-500 mt-1 flex items-center">
                            <Calendar className="mr-2 h-4 w-4" />
                            {format(new Date(nextEvent.startDate), "d MMMM yyyy", { locale: fr })}
                        </p>
                        <div className="mt-4">
                            <Button asChild size="sm" className="bg-pink-600 hover:bg-pink-700">
                                <Link href={`/dashboard/leader/events/${nextEvent.id}`}>
                                    Gérer le planning <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-6 text-gray-400">
                    Aucun événement spécial planifié prochainement.
                </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Aperçu Nuit Prochaine */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-indigo-600" />
                Nuit du {format(tomorrow, "d MMMM", { locale: fr })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!nightWatch ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                    <ShieldAlert className="h-10 w-10 text-orange-400 mb-2" />
                    <p className="font-medium text-gray-600">Aucune famille assignée !</p>
                    <Link href="/dashboard/leader/prayer-house" className="text-sm text-indigo-600 underline mt-2">
                        Assigner maintenant
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm bg-indigo-50 p-2 rounded">
                        <span className="text-gray-600">Famille de garde :</span>
                        <span className="font-bold text-indigo-900">{nightWatch.family.name}</span>
                    </div>

                    <div className="space-y-2">
                        {["00:00", "01:00", "02:00", "03:00"].map(hour => {
                            const schedule = nightWatch.schedules.find(s => s.startTime === hour);
                            return (
                                <div key={hour} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                                    <span className="font-mono text-gray-500">{hour}</span>
                                    {schedule ? (
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-800">{schedule.user?.name}</span>
                                            <Avatar className="h-5 w-5">
                                                <AvatarImage src={schedule.user?.image?? undefined} />
                                                <AvatarFallback className="text-[9px]">{schedule.user?.name?.[0]}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                    ) : (
                                        <span className="text-red-400 italic text-xs">Non pourvu</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <Button asChild variant="outline" size="sm" className="w-full mt-2">
                        <Link href="/dashboard/leader/prayer-house">Voir le planning complet</Link>
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}