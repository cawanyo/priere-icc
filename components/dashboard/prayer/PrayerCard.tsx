// components/dashboard/prayer/PrayerCard.tsx
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MoreVertical, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { updatePrayerStatus } from "@/app/actions/prayer";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PrayerCardProps {
  prayer: {
    id: string;
    subjectType: string;
    content: string;
    status: string;
    createdAt: Date;
  };
}

const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
  PENDING: { label: "En attente", color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100", icon: Clock },
  ANSWER: { label: "Exaucé", color: "bg-green-100 text-green-800 hover:bg-green-100", icon: CheckCircle2 },
  FAILED: { label: "Non exaucé", color: "bg-red-100 text-red-800 hover:bg-red-100", icon: XCircle },
};

export function PrayerCard({ prayer }: PrayerCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const currentStatus = statusConfig[prayer.status] || statusConfig["PENDING"];
  const StatusIcon = currentStatus.icon;

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    const res = await updatePrayerStatus(prayer.id, newStatus);
    setIsUpdating(false);
    
    if (res.success) {
      toast.success(`Prière marquée comme ${statusConfig[newStatus].label}`);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex flex-col gap-1">
            <Badge variant="outline" className="w-fit mb-1">{prayer.subjectType}</Badge>
            <span className="text-xs text-muted-foreground capitalize">
            {format(new Date(prayer.createdAt), "d MMMM yyyy", { locale: fr })}
            </span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleStatusChange("PENDING")}>
                <Clock className="mr-2 h-4 w-4 text-yellow-600" /> En attente
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("ANSWER")}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Exaucé
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("FAILED")}>
                <XCircle className="mr-2 h-4 w-4 text-red-600" /> Non exaucé
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="flex-1 mt-2">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {prayer.content}
        </p>
      </CardContent>

      <CardFooter className="pt-2 border-t mt-auto">
        <Badge className={`${currentStatus.color} border-none px-3 py-1 flex items-center gap-1.5`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {currentStatus.label}
        </Badge>
      </CardFooter>
    </Card>
  );
}