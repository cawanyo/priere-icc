"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { convertKeepDate  } from "@/lib/utils";

export function IntercessorEventList({ events }: { events: any[] }) {
  if (events.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-gray-500">
            Aucun événement spécial programmé pour le moment.
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(evt => (
            <Card key={evt.id} className="hover:shadow-md transition-all duration-300 border-gray-100 flex flex-col group">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-serif text-indigo-900 line-clamp-1">{evt.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                    <div className="text-sm text-gray-500 flex items-center mb-4 bg-gray-50 p-2 rounded-md w-fit">
                        <Calendar className="h-4 w-4 mr-2 text-pink-500" />
                        <span className="font-medium">
                            {format(convertKeepDate(evt.startDate),"d MMM")}
                        </span>
                        <span className="mx-1.5">-</span>
                        <span className="font-medium">
                            {format(convertKeepDate(evt.endDate), "d MMM yyyy")}
                        </span>
                    </div>
                    
                    <div className="mt-auto pt-4">
                        <Button asChild variant="outline" className="w-full group-hover:border-indigo-200 group-hover:text-indigo-700 transition-colors">
                            <Link href={`/dashboard/user/intercessor/events/${evt.id}`}>
                                Voir le planning <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
  );
}