"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, addWeeks, addDays, isSameDay, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { fr, is, se } from "date-fns/locale";
import { 
    ChevronLeft, 
    ChevronRight, 
    Moon, 
    ShieldAlert, 
    UserMinus, 
    Calendar, 
    Plus, 
    Trash2,
    X
} from "lucide-react";
import dynamic from "next/dynamic";

// UI Components
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { updateWeekTheme, updateDayTheme, clearWeeklyAssignment, getFamilyUnavailabilities } from "@/app/actions/prayer-house-planning";


import { 
    getNightPlanning, 
    assignFamilyToWeek, 
    updateNightSlot, 
    addWeeklySlot, 
    removeWeeklySlot 
} from "@/app/actions/prayer-house-planning";
import { getPrayerFamilies } from "@/app/actions/prayer-house";
import { ThemeEditor } from "./ThemeEditor";
import { convertKeepDate } from "@/lib/utils";
import { SearchableUserSelect } from "../SearchUserSelect";
import { ConfirmDelete } from "../DeleteConfirm";
import supabase from "@/lib/superbase";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { REALTIME_CHANNELS } from "@/lib/realtime-channels";
import {  getBlackList, updateBlackList } from "@/app/actions/blacklist";
import { getLeaders } from "@/app/actions/leader";
import { AutoFillButton } from "../dashboard/leader/AutofillButton";
import { ClearPlanningButton } from "../dashboard/leader/ClearAssignment";

// --- IMPORT DYNAMIQUE DU BOUTON PDF (Pour éviter l'erreur SSR) ---


export function NightPlanningBoard({unavailabilities}: {unavailabilities?: any[]}) {
    const DownloadNightButton = dynamic(
        () => import("@/components/pdf/DownloadPlanningButton").then((mod) => mod.DownloadNightButton),
        { 
            ssr: false,
            loading: () => <Button variant="outline" disabled size="sm">Chargement PDF...</Button>
        }
        );


  // --- ÉTATS ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [assignment, setAssignment] = useState<any>(null);
  const [allFamilies, setAllFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modales
  const [selectedSlot, setSelectedSlot] = useState<{date: Date, hour: string} | null>(null);
  const [isAddHourOpen, setIsAddHourOpen] = useState(false);
  const [newHour, setNewHour] = useState("04:00");
  const [leader, setLeader] = useState<any[]>([]);
  // --- CHARGEMENT ---
  const loadData = async () => {
    setLoading(true);
    const planRes = await getNightPlanning(currentDate);
    if (planRes.success) setAssignment(planRes.assignment);
    setLoading(false);
  };

  useEffect(() => {
    loadData();

  }, [currentDate]);

  useEffect(() => {
    getPrayerFamilies().then(res => {
      if (res.success) setAllFamilies(res.data || []);
    });

    const get = async () => {
        const leader = (await getLeaders()).data ?? [];
        setLeader(leader)
    }
    get();

  }, []);



  // Synchronisation temps réel (Pusher WebSocket + Supabase Realtime)
  useRealtimeSync({
    channel: REALTIME_CHANNELS.PRAYER_HOUSE,
    onUpdate: loadData,
  });
  useRealtimeSync({
    channel: "prayer-room-updates",
    onUpdate: loadData,
  });



  const handleClearAssignment = async () => {
    if (!assignment) return;
    
    // Confirmation de sécurité

    setLoading(true);
    const res = await clearWeeklyAssignment(assignment.id);
    
    
    if (res.success) {
        setAssignment(null); // On vide l'état local immédiatement
        toast.success("Semaine réinitialisée à blanc");
        loadData(); // On recharge proprement
    } else {
        toast.error("Erreur lors de la réinitialisation");
    }
    setLoading(false);
  };

  // --- LOGIQUE HEURES DYNAMIQUES ---
  const defaultHours = ["00:00", "01:00", "02:00", "03:00"];
  // On récupère les heures en DB + les par défaut
  const existingHours = assignment?.schedules 
    ? Array.from(new Set(assignment.schedules.map((s: any) => s.startTime))) as string[]
    : [];
  const displayHours = Array.from(new Set([...defaultHours, ...existingHours])).sort();

  // --- LOGIQUE JOURS ---
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 5 }).map((_, i) => addDays(weekStart, i));
  const [selectedMobileDay, setSelectedMobileDay] = useState<Date>(() => {
    const now = new Date();
    const ws = startOfWeek(new Date(), { weekStartsOn: 1 });
    const initialDays = Array.from({ length: 5 }).map((_, i) => addDays(ws, i));
    return initialDays.find((d) => isSameDay(d, now)) || initialDays[0];
  });

  useEffect(() => {
    const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
    const newDays = Array.from({ length: 5 }).map((_, i) => addDays(ws, i));
    const now = new Date();
    const match = newDays.find((d) => isSameDay(d, now));
    setSelectedMobileDay(match || newDays[0]);
  }, [currentDate]);

  // --- STATS ---
  // On ne compte que les slots qui ont un User
  const totalSlots = days.length * displayHours.length;
  const filledSlots = assignment?.schedules?.filter((s: any) => s.userId).length || 0;
  const fillRate = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  const getProgressColor = (rate: number) => {
    if (rate < 50) return "bg-red-500";
    if (rate < 80) return "bg-orange-500";
    return "bg-green-500";
  };


  const getDayTheme = (date: Date) => {
    return assignment?.dayThemes?.find((t: any) => isSameDay(convertKeepDate(t.date), date))?.theme;
  };


  // --- ACTIONS ---
  const handleAssignFamily = async (familyId: string) => {
    const res = await assignFamilyToWeek(currentDate.toDateString(), familyId);
    if (res.success) {
        toast.success("Famille assignée !");
        loadData();
    }
  };

  const [availableUserList, setAvailableUserListe] = useState<any[]>([]);

  const onSelectSlot = async (day: Date, hour: string) => {
    const blackList_ = (await getBlackList( hour)).map((item: any) => item.userId);
    let availableUsers =  assignment.prayerFamily.users.filter((member: any) => isMemberAvailable(day, member) && !blackList_.includes( member.id) );
    availableUsers = availableUsers.concat(leader)
    setAvailableUserListe(availableUsers)
    setSelectedSlot({ date: day, hour });
  }
 
  const isMemberAvailable = ( slotDate: Date, user: any) => {
    if (!unavailabilities || unavailabilities.length === 0) return true;

    // Vérifie si la date du slot tombe dans UNE des périodes d'indisponibilité
    const isUnavailable = unavailabilities.some((u: any) => {
        const start = startOfDay(new Date(u.startDate));
        const end = endOfDay(new Date(u.endDate)); // Fin de journée incluse
        const target = startOfDay(slotDate);

        return isWithinInterval(target, { start, end }) && u.userId === user.id;
    });

    return !isUnavailable; // Si indisponible, return false (donc masqué)
    };


  const handleAssignUser = async (userId: string | "REMOVE") => {
    if (!selectedSlot || !assignment) return;

    const res = await updateNightSlot({
        assignmentId: assignment.id,
        date: selectedSlot.date.toDateString(),
        startTime: selectedSlot.hour,
        userId
    });
    setSelectedSlot(null);
    if (res.success && userId !== "REMOVE" ) { 
        const res = await updateBlackList( userId, selectedSlot.hour);
      }

    loadData();
    toast.success(userId === "REMOVE" ? "Créneau libéré" : "Sentinelle assignée");
  };

  const handleAddRow = async () => {
    if (!assignment) return;
    const res = await addWeeklySlot(assignment.id, weekStart, newHour);
    if(res.success) {
        setIsAddHourOpen(false);
        loadData();
        toast.success(`Créneau de ${newHour} ajouté`);
    } else {
        toast.error("Erreur ajout créneau");
    }
  };

  const handleRemoveRow = async (hour: string) => {
    if (!assignment) return;
    const res = await removeWeeklySlot(assignment.id, hour);
    if(res.success) {
        loadData();
        toast.success("Ligne supprimée");
    }
  };

  // Helper
  const getSchedule = (day: Date, hour: string) => {
    return assignment?.schedules.find((s: any) => 
        isSameDay(convertKeepDate(s.date), day) && s.startTime === hour
    );
  };

  return (
    <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        
        {/* HEADER */}
        <div className="flex flex-col gap-3.5 border-b border-slate-100 pb-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                {/* Nav Date */}
                <div className="w-full flex items-center justify-between md:w-auto gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg cursor-pointer" onClick={() => setCurrentDate(addWeeks(currentDate, -1))}>
                        <ChevronLeft className="h-4 w-4 text-slate-600" />
                    </Button>
                    <div className="text-center min-w-[140px] px-2">
                        <h3 className="font-bold text-xs sm:text-sm capitalize text-slate-900 leading-none">
                            {format(currentDate, "MMMM yyyy", { locale: fr })}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            {format(weekStart, "d MMM", { locale: fr })} — {format(addDays(weekStart, 4), "d MMM", { locale: fr })}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg cursor-pointer" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
                        <ChevronRight className="h-4 w-4 text-slate-600" />
                    </Button>
                </div>

                {/* Choix Famille */}
                <div className="w-full md:w-72 flex items-center gap-2">
                    {loading ? (
                        <div className="h-9 w-full bg-slate-100 animate-pulse rounded-xl" />
                    ) : (
                        <Select value={assignment?.familyId || ""} onValueChange={handleAssignFamily}>
                            <SelectTrigger className={`h-9 text-xs w-full rounded-xl ${assignment ? "border-indigo-300 bg-indigo-50/70 text-indigo-900 font-medium" : "border-slate-200"}`}>
                                <SelectValue placeholder="Choisir la maison..." />
                            </SelectTrigger>
                            <SelectContent>
                                {allFamilies.map(f => (
                                    <SelectItem key={f.id} value={f.id}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                                            <span>{f.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    {assignment && (
                      <ConfirmDelete
                          onConfirm={handleClearAssignment}
                          title="Désassigner la famille"
                          description="Cette action va retirer l'assignation de cette semaine et remettre le planning à blanc. Continuer ?"  
                      />
                    )}
                </div>
            </div>

            {assignment && (
                <div className="pt-1">
                    <ThemeEditor
                        type="week"
                        initialValue={assignment.weekTheme}
                        onSave={async (val) => {await updateWeekTheme(assignment.id, val); loadData()}}
                        placeholder="Ex: La Puissance du Sang de Jésus"
                    />
                </div>
            )}

            {/* BARRE OUTILS (Si assigné) */}
            {assignment && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                    
                    {/* Progress Bar */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex flex-col gap-1 w-full md:w-40">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                                <span>Couverture</span>
                                <span className={fillRate === 100 ? "text-emerald-600 font-bold" : "text-slate-700 font-bold"}>{fillRate}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-500 ${getProgressColor(fillRate)}`} 
                                    style={{ width: `${fillRate}%` }} 
                                />
                            </div>
                        </div>
                        <div className="text-[11px] text-slate-400 border-l border-slate-200 pl-3 hidden sm:block">
                            <strong>{filledSlots}</strong> / {totalSlots} créneaux
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full flex-wrap md:w-auto">
                        {/* Ajouter Heure */}
                        <Dialog open={isAddHourOpen} onOpenChange={setIsAddHourOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 text-xs font-semibold rounded-xl text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer">
                                    <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter heure
                                </Button>
                            </DialogTrigger>
                            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="sm:max-w-[320px] rounded-2xl">
                                <DialogHeader><DialogTitle className="text-sm font-bold">Ajouter une ligne horaire</DialogTitle></DialogHeader>
                                <div className="py-3 space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-600">Heure de début</label>
                                        <Select value={newHour} onValueChange={setNewHour}>
                                            <SelectTrigger className="h-9 text-xs rounded-xl"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {["20:00","21:00","22:00","23:00","04:00","05:00","06:00"].map(h => (
                                                    <SelectItem key={h} value={h}>{h}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={handleAddRow} className="w-full bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl h-9 text-xs font-semibold cursor-pointer">Ajouter</Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* PDF */}
                        {/* <DownloadNightButton 
                            weekDate={currentDate} 
                            familyName={assignment.family.name}
                            schedules={assignment.schedules}
                        /> */}


                        {assignment && (
                            <>
                                <ClearPlanningButton assignmentId={assignment.id} finallyFunction={loadData} />
                                <AutoFillButton 
                                    assignmentId={assignment.id} 
                                    finallyFunction={loadData}
                                    date={currentDate} 
                                />
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* --- PLANNING --- */}
        {!assignment ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                <ShieldAlert className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Aucune famille assignée</p>
                <p className="text-sm text-gray-400 mt-1">Sélectionnez une famille ci-dessus.</p>
            </div>
        ) : (
            <>
                {/* VUE MOBILE : Ligne d'options 5 jours + Détail du jour sélectionné */}
                <div className="md:hidden space-y-3">
                    {/* Ligne des 5 jours de la semaine */}
                    <div className="grid grid-cols-5 gap-1.5">
                        {days.map(day => {
                            const isSelected = isSameDay(day, selectedMobileDay);
                            const filledCount = displayHours.filter(h => {
                                const s = getSchedule(day, h);
                                return s && s.user;
                            }).length;

                            return (
                                <button
                                    key={day.toISOString()}
                                    type="button"
                                    onClick={() => setSelectedMobileDay(day)}
                                    className={`
                                        flex flex-col items-center justify-center py-2 px-1 rounded-2xl border transition-all cursor-pointer text-center relative
                                        ${isSelected
                                            ? "bg-indigo-900 text-white border-indigo-900 shadow-sm"
                                            : "bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700 shadow-2xs"
                                        }
                                    `}
                                >
                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                                        {format(day, "EEE", { locale: fr })}
                                    </span>
                                    <span className="text-base font-bold leading-tight mt-0.5">
                                        {format(day, "d")}
                                    </span>
                                    <span className={`text-[9px] mt-0.5 font-medium px-1.5 py-0.2 rounded-full ${
                                        isSelected
                                            ? "bg-white/20 text-white"
                                            : filledCount === displayHours.length && displayHours.length > 0
                                            ? "bg-emerald-50 text-emerald-700 font-semibold"
                                            : filledCount > 0
                                            ? "bg-slate-100 text-slate-600"
                                            : "text-slate-400"
                                    }`}>
                                        {filledCount}/{displayHours.length}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Détail du jour sélectionné avec Thème et Créneaux */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs space-y-3">
                        <div className="flex flex-col gap-2 pb-2.5 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-indigo-600" />
                                    <span className="font-bold text-sm text-slate-900 capitalize">
                                        {format(selectedMobileDay, "EEEE d MMMM", { locale: fr })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-lg cursor-pointer"
                                        onClick={() => {
                                            const idx = days.findIndex(d => isSameDay(d, selectedMobileDay));
                                            if (idx > 0) setSelectedMobileDay(days[idx - 1]);
                                        }}
                                        disabled={isSameDay(selectedMobileDay, days[0])}
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-lg cursor-pointer"
                                        onClick={() => {
                                            const idx = days.findIndex(d => isSameDay(d, selectedMobileDay));
                                            if (idx < days.length - 1) setSelectedMobileDay(days[idx + 1]);
                                        }}
                                        disabled={isSameDay(selectedMobileDay, days[days.length - 1])}
                                    >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Éditeur de thème du jour */}
                            <div>
                                <ThemeEditor 
                                    type="day"
                                    initialValue={getDayTheme(selectedMobileDay)}
                                    onSave={async (val) => {await updateDayTheme(assignment.id, selectedMobileDay.toDateString(), val); loadData()}}
                                />
                            </div>
                        </div>

                        {/* Créneaux du jour */}
                        <div className="grid grid-cols-2 gap-2">
                            {displayHours.map(hour => {
                                const schedule = getSchedule(selectedMobileDay, hour);
                                const isFilled = schedule && schedule.user;

                                return (
                                    <div 
                                        key={hour}
                                        onClick={() => onSelectSlot(selectedMobileDay, hour)}
                                        className={`
                                            relative p-2 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center min-h-[46px]
                                            ${isFilled 
                                                ? "bg-indigo-50/70 border-indigo-200" 
                                                : "bg-white border-dashed border-slate-200 active:bg-slate-50"
                                            }
                                        `}
                                    >
                                        <span className="absolute top-1 left-1.5 text-[9px] font-bold text-slate-400">{hour}</span>
                                        {isFilled ? (
                                            <div className="flex flex-col items-center mt-0.5">
                                                <Avatar className="h-5 w-5 ring-1 ring-white shadow-2xs mb-0.5">
                                                    <AvatarImage src={schedule.user?.image} />
                                                    <AvatarFallback className="bg-indigo-600 text-white text-[8px] font-bold">
                                                        {schedule.user?.name?.slice(0,1)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-[10px] font-medium text-slate-900 truncate max-w-[85px]">
                                                    {schedule.user?.name?.split(" ")[0]}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-slate-300 mt-0.5">
                                                <Moon className="h-3 w-3 mb-0.5" />
                                                <span className="text-[8px] font-medium">Libre</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* VUE DESKTOP */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80">
                                <th className="p-2 w-16 border-b border-r border-slate-200/80 text-slate-400 font-semibold text-xs">Heure</th>
                                {days.map(day => (
                                    <th key={day.toISOString()} className="p-2 border-b border-r last:border-r-0 border-slate-200/80 text-center min-w-[95px] max-w-[140px]">
                                        <span className="block text-[10px] uppercase text-slate-400 font-bold mb-0.5">
                                            {format(day, "EEEE", { locale: fr })}
                                        </span>
                                        <span className="block text-sm font-bold text-slate-900 leading-tight">
                                            {format(day, "d MMM", { locale: fr })}
                                        </span>
                                        <div className="mt-1 flex justify-center">
                                            <ThemeEditor 
                                                type="day"
                                                initialValue={getDayTheme(day)}
                                                onSave={async (val) => {await updateDayTheme(assignment.id, day.toDateString(), val); loadData()}}
                                            />
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {displayHours.map(hour => (
                                <tr key={hour} className="group hover:bg-slate-50/30">
                                    <td className="p-1.5 text-center font-mono text-[11px] font-semibold text-slate-500 border-r border-b border-slate-200/80 group-last:border-b-0 bg-slate-50/40 relative">
                                        <div className="flex items-center justify-center gap-1">
                                            <span>{hour}</span>
                                            <ConfirmDelete
                                                onConfirm={() => handleRemoveRow(hour)}
                                                title="Supprimer cette ligne horaire"
                                                description={`Êtes-vous sûr de vouloir supprimer tous les créneaux de ${hour} ? Cette action est irréversible.`}
                                            />
                                        </div>
                                    </td>
                                    {days.map(day => {
                                        const schedule = getSchedule(day, hour);
                                        const isFilled = schedule && schedule.user;

                                        return (
                                            <td key={day.toISOString()} className="p-1 border-b border-r last:border-r-0 border-slate-200/80 group-last:border-b-0">
                                                <div 
                                                    onClick={() => onSelectSlot(day, hour)}
                                                    className={`
                                                        h-11 sm:h-12 rounded-lg flex items-center justify-center cursor-pointer transition-all border
                                                        ${isFilled 
                                                            ? "bg-indigo-50/70 border-indigo-200 hover:border-indigo-300 hover:shadow-2xs" 
                                                            : "bg-white border-transparent hover:border-slate-200"
                                                        }
                                                        ${(!isFilled && schedule) ? "border-dashed border-slate-200" : ""}
                                                    `}
                                                >
                                                    {isFilled ? (
                                                        <div className="flex items-center gap-1.5 px-2 min-w-0">
                                                            <Avatar className="h-5 w-5 ring-1 ring-white shadow-2xs shrink-0">
                                                                <AvatarImage src={schedule.user?.image} />
                                                                <AvatarFallback className="bg-indigo-600 text-white text-[8px] font-bold">
                                                                    {schedule.user?.name?.slice(0,1)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-[11px] font-medium text-slate-800 truncate max-w-[75px]">
                                                                {schedule.user?.name?.split(" ")[0]}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-slate-300">
                                                            <Moon className="h-3 w-3" />
                                                            <span className="text-[9px] font-medium">Libre</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </>
        )}

        {/* MODALE ASSIGNATION */}
        <Dialog open={!!selectedSlot} onOpenChange={(open) => !open && setSelectedSlot(null)}>
            <DialogContent className="sm:max-w-md overflow-visible"> 
                {/* Note: overflow-visible aide parfois si la liste déroulante est très longue */}
                
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Moon className="h-5 w-5 text-indigo-500" />
                        <span>
                            {selectedSlot && format(selectedSlot.date, "EEEE d MMMM", { locale: fr })}
                        </span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-sm text-gray-600">
                            {selectedSlot?.hour}
                        </span>
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4 w-full">
                    <p className="text-sm text-gray-500">
                        Membre de garde (<strong>{assignment?.family?.name}</strong>) :
                    </p>
                    
                    {/* --- REMPLACEMENT ICI --- */}
                    <div>{selectedSlot?.date && getSchedule(selectedSlot?.date, selectedSlot?.hour)?.user?.name}</div>
                    <div className="pt-1">
                        <SearchableUserSelect 
                            users={availableUserList || []}
                            onSelect={(userId) => handleAssignUser(userId)}
                            placeholder="Rechercher une sentinelle..."
                        />
                        <p className="text-[10px] text-gray-400 mt-2 italic">
                            * L'assignation se fait automatiquement dès la sélection.
                        </p>
                    </div>
                    {/* ------------------------ */}

                    <div className="border-t pt-4 mt-2">
                        <Button 
                            variant="ghost" 
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50" 
                            onClick={() => handleAssignUser("REMOVE")}
                        >
                            <UserMinus className="mr-2 h-4 w-4" /> Retirer la sentinelle / Laisser vide
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}