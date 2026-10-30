import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Radio, Flame } from "lucide-react";

interface AdminStatsProps {
  stats: {
    totalUsers: number;
    intercessors: number;
    admins: number;
    prayerLeaders: number;
  };
}

export function AdminStats({ stats }: AdminStatsProps) {
  const cards = [
    { title: "Total Utilisateurs", value: stats.totalUsers, icon: Users, color: "text-blue-600" },
    { title: "Conducteurs de Prière", value: stats.prayerLeaders, icon: Flame, color: "text-indigo-600" },
    { title: "Intercesseurs", value: stats.intercessors, icon: Radio, color: "text-purple-600" },
    { title: "Admins", value: stats.admins, icon: Shield, color: "text-red-600" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
