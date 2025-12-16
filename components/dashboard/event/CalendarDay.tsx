import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { PlaningWithIntercessor, SpecialEventWithPlaning } from '@/lib/types';
import { convertKeepDate } from '@/lib/utils';
import { format, isSameDay, isWithinInterval, startOfDay } from 'date-fns';
import { CalendarCheck } from 'lucide-react';
import React from 'react'

interface props {
    specialEvent: SpecialEventWithPlaning,
    day: Date,
    handleEventClick: (evt: PlaningWithIntercessor, day:Date) => void
}
function CalendarDay({specialEvent, day, handleEventClick}: props) {

    const eventStartDate = convertKeepDate(specialEvent.startDate);
    const eventEndDate = convertKeepDate(specialEvent.endDate);

    const dayEvents = specialEvent.plannings.filter(e => isSameDay(startOfDay(convertKeepDate(e.date)), startOfDay(day)));
    dayEvents.sort((a,b) => {

        const [aH, aM] = a.startTime.split(":").map(Number);
        const [bH, bM] = b.startTime.split(":").map(Number);

        return aH - bH || aM - bM;
    })
    
    const isEventDay = isWithinInterval(startOfDay(day), {
        start: eventStartDate,
        end: eventEndDate
    });

    return (
        <div 
            key={day.toISOString()} 
            className={`flex flex-col gap-3 min-h-[200px] rounded-xl p-3 border transition-colors
                ${isEventDay ? 'bg-gray-50/50 border-gray-100' : 'bg-gray-100/30 border-transparent opacity-50'}`}
        >
            {/* En-tête Jour */}
            <div className="text-center mb-2">
                <span className="block text-xs font-semibold text-gray-500 uppercase">
                    {format(day, "EEEE")}
                </span>
                <span className={`block text-xl font-bold ${isEventDay ? 'text-indigo-900' : 'text-gray-400'}`}>
                    {format(day, "d")}
                </span>
            </div>

            {/* Créneaux */}
            {dayEvents.map(evt => (
                <Card 
                    key={evt.id}
                    onClick={() => handleEventClick(evt, day)}
                    className={`p-3 cursor-pointer hover:shadow-md transition-all border-l-4 text-left space-y-1 bg-white
                        `}
                >
                    <div className="flex justify-between items-start">
                        <span className="font-semibold text-sm truncate w-full">{evt.title}</span>
                        <CalendarCheck className="h-3 w-3 text-pink-500 shrink-0 ml-1" />
                    </div>
                    <p className="text-xs text-gray-500">
                        {evt.startTime} - {evt.endTime}
                    </p>

                    {/* Avatars Intercesseurs */}
                    {evt.intercessors && evt.intercessors.length > 0 ? (
                        <div className="flex -space-x-2 overflow-hidden pt-2">
                            {evt.intercessors.map((u: any) => (
                                <div key={u.id} className="flex items-center gap-1">
                                    <Avatar key={u.id} className="inline-block h-4 w-4 rounded-full ring-2 ring-white">
                                        <AvatarImage src={u.image} />
                                        <AvatarFallback className="text-[9px] bg-indigo-100 text-indigo-700">
                                            {u.name?.slice(0,1)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <p className="text-[8px]">{u.name}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center text-[10px] text-gray-400 mt-1 italic">
                            Non assigné
                        </div>
                    )}
                </Card>
            ))}

            
        </div>
    )
}

export default CalendarDay;