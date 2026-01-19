"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, addWeeks, addDays, isSameDay, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { fr, se } from "date-fns/locale";
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
import {  getBlackList, updateBlackList } from "@/app/actions/blacklist";
import { getLeaders } from "@/app/actions/leader";

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

  


  useEffect(() => {
    const channel = supabase.channel('prayer-room-updates');

    channel
      .on(
        'broadcast', 
        { event: 'change' },
        (payload) => {
           loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentDate]);



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

    let availableUsers =  assignment.family.members.filter((member: any) => isMemberAvailable(day, member) && !blackList_.includes( member.id) );
    availableUsers = availableUsers.concat(leader)
    console.log(leader)
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
    <div className="space-y-6 bg-white p-4 md:p-6 rounded-xl border shadow-sm">
        
        {/* HEADER */}
        <div className="flex flex-col gap-4 border-b pb-6">
            <div className="flex flex-col  md:flex-row justify-between items-center gap-4">
                {/* Nav Date */}
                <div className="w-full flex flex-wrap items-center justify-between  md:w-auto gap-4 bg-gray-50 p-2 rounded-lg">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, -1))}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="text-center">
                        <h3 className="font-bold text-xs md:text-lg capitalize text-indigo-900">
                            {format(currentDate, "MMMM yyyy", { locale: fr })}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">
                            {format(weekStart, "dd MMM")} - {format(addDays(weekStart, 4), "dd MMM")}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>

                {/* Choix Famille */}
                <div className="w-full md:w-72 flex">
                    {loading ? (
                        <div className="h-10 bg-gray-100 animate-pulse rounded" />
                    ) : (
                        <Select value={assignment?.familyId || ""} onValueChange={handleAssignFamily}>
                            <SelectTrigger className={`h-12 md:h-10 text-xs w-full md:text-sm ${assignment ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium" : ""}`}>
                                <SelectValue placeholder="Choisir la famille..." />
                            </SelectTrigger>
                            <SelectContent>
                                {allFamilies.map(f => (
                                    <SelectItem key={f.id} value={f.id}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: f.color }} />
                                            {f.name}
                                        </div>
                                    </SelectItem>
                                ))}
                                
                            </SelectContent>
                        </Select>
                    )}
                    <ConfirmDelete
                        onConfirm={handleClearAssignment}
                        title="Désassigner la famille de cette semaine"
                        description="Cette action va supprimer tous les créneaux assignés et remettre la semaine à blanc. Continuer ?"  
                    />
                </div>
            </div>



            {assignment && (
                <div className="mb-6 px-1">
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
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    
                    {/* Progress Bar */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex flex-col gap-1 w-full md:w-48">
                            <div className="flex justify-between text-xs font-semibold uppercase text-gray-500">
                                <span>Couverture</span>
                                <span className={fillRate === 100 ? "text-green-600" : "text-gray-600"}>{fillRate}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-500 ${getProgressColor(fillRate)}`} 
                                    style={{ width: `${fillRate}%` }} 
                                />
                            </div>
                        </div>
                        <div className="text-xs text-gray-400 border-l pl-4 hidden sm:block">
                            <strong>{filledSlots}</strong> / {totalSlots}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full flex-wrap md:w-auto">
                        {/* Ajouter Heure */}
                        <Dialog open={isAddHourOpen} onOpenChange={setIsAddHourOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="flex-1 md:flex-none text-indigo-600 border-indigo-200 bg-white hover:bg-indigo-50">
                                    <Plus className="mr-2 h-4 w-4" /> <span className="md:hidden">Heure</span><span className="hidden md:inline">Ajouter créneau</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[300px]">
                                <DialogHeader><DialogTitle>Ajouter une ligne</DialogTitle></DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Heure</label>
                                        <Select value={newHour} onValueChange={setNewHour}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {["20:00","21:00","22:00","23:00","04:00","05:00","06:00"].map(h => (
                                                    <SelectItem key={h} value={h}>{h}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={handleAddRow} className="w-full bg-indigo-900">Ajouter</Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* PDF */}
                        <DownloadNightButton 
                            weekDate={currentDate} 
                            familyName={assignment.family.name}
                            schedules={assignment.schedules}
                        />
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
                {/* VUE MOBILE */}
                <div className="md:hidden space-y-4">
                    {days.map(day => (
                        <div key={day.toISOString()} className="border rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-gray-50 p-3 border-b flex flex-wrap items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-indigo-500" />
                                    <span className="font-bold text-gray-800 capitalize">
                                        {format(day, "EEEE d", { locale: fr })}
                                    </span>
                                </div>
                                <div className="pl-6">
                                    <ThemeEditor 
                                        type="day"
                                        initialValue={getDayTheme(day)}
                                        onSave={async (val) => {await updateDayTheme(assignment.id, day.toDateString(), val); loadData()}}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 p-3 bg-white">
                                {displayHours.map(hour => {
                                    const schedule = getSchedule(day, hour);
                                    // CORRECTION : Est-ce que la case est vraiment prise ?
                                    const isFilled = schedule && schedule.user;

                                    return (
                                        <div 
                                            key={hour}
                                            onClick={() => onSelectSlot(day, hour)}
                                            className={`
                                                relative p-3 rounded-lg border cursor-pointer transition-all flex flex-col items-center justify-center min-h-[80px]
                                                ${isFilled 
                                                    ? "bg-indigo-50 border-indigo-200" 
                                                    : "bg-white border-dashed border-gray-200 active:bg-gray-50"
                                                }
                                            `}
                                        >
                                            <span className="absolute top-2 left-2 text-[10px] font-bold text-gray-400">{hour}</span>
                                            {isFilled ? (
                                                <div className="flex flex-col items-center mt-2">
                                                    <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm mb-1">
                                                        <AvatarImage src={schedule.user?.image} />
                                                        <AvatarFallback className="bg-indigo-600 text-white text-xs">
                                                            {schedule.user?.name?.slice(0,1)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-[10px] font-medium text-indigo-900 truncate max-w-[80px]">
                                                        {schedule.user?.name?.split(" ")[0]}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center text-gray-300 mt-2">
                                                    <Moon className="h-5 w-5 mb-1" />
                                                    <span className="text-[10px]">Libre</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* VUE DESKTOP */}
                <div className="hidden md:block overflow-x-auto rounded-lg border">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="p-4 w-24 border-b border-r text-gray-400 font-normal text-xs">Heure</th>
                                {days.map(day => (
                                    <th key={day.toISOString()} className="p-4 border-b text-center min-w-[120px]">
                                        <span className="block text-xs uppercase text-gray-500 font-semibold mb-1">
                                            {format(day, "EEEE", { locale: fr })}
                                        </span>
                                        <span className="block text-xl font-bold text-indigo-950">
                                            {format(day, "d")}
                                        </span>
                                        <div className="mt-1">
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
                                <tr key={hour} className="group hover:bg-gray-50/30">
                                    <td className="p-4 text-center font-mono text-sm text-gray-500 border-r border-b group-last:border-b-0 bg-gray-50/30 relative">
                                        {hour}
                                       
                                        <ConfirmDelete
                                            onConfirm={() => handleRemoveRow(hour)}
                                            title="Supprimer cette ligne horaire"
                                            description={`Êtes-vous sûr de vouloir supprimer tous les créneaux de ${hour} ? Cette action est irréversible.`}
                                        />
                                    </td>
                                    {days.map(day => {
                                        const schedule = getSchedule(day, hour);
                                        // CORRECTION : Est-ce que la case est vraiment prise ?
                                        const isFilled = schedule && schedule.user;

                                        return (
                                            <td key={day.toISOString()} className="p-2 border-b border-r last:border-r-0 group-last:border-b-0">
                                                <div 
                                                    onClick={() => onSelectSlot(day, hour)}
                                                    className={`
                                                        h-20 rounded-xl flex items-center justify-center cursor-pointer transition-all border-2
                                                        ${isFilled 
                                                            ? "bg-indigo-50 border-indigo-100 hover:border-indigo-300 hover:shadow-md" 
                                                            : "bg-white border-transparent hover:border-gray-200 hover:bg-white"
                                                        }
                                                        ${(!isFilled && schedule) ? "border-dashed border-gray-300" : ""}
                                                    `}
                                                >
                                                    {isFilled ? (
                                                        <div className="flex flex-col items-center gap-1.5 animate-in zoom-in-95 duration-200">
                                                            <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm">
                                                                <AvatarImage src={schedule.user?.image} />
                                                                <AvatarFallback className="bg-indigo-600 text-white text-xs">
                                                                    {schedule.user?.name?.slice(0,1)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-xs font-semibold text-indigo-900 truncate max-w-[100px]">
                                                                {schedule.user?.name}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center text-gray-300">
                                                            <Moon className="h-5 w-5 mb-1" />
                                                            <span className="text-[10px] font-medium uppercase tracking-wide">Libre</span>
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