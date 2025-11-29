"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PrayerStatusBadge } from "./PrayerStatusBadge";
import { Mail, Phone, Calendar, Quote, X, Check, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { updateGlobalPrayerStatus } from "@/app/actions/leader";
import { toast } from "sonner";

interface PrayerDetailsProps {
  prayer: any | null;
  open: boolean;
  onClose: () => void;
}

export function PrayerDetails({ prayer, open, onClose }: PrayerDetailsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  if (!prayer) return null;

  // Récupération intelligente des coordonnées (Priorité à la requête, sinon profil utilisateur)
  const displayEmail = prayer.email || prayer.user?.email;
  const displayPhone = prayer.phone || prayer.user?.phone;
  const displayName = prayer.name || prayer.user?.name || "Anonyme";
  const displayImage = prayer.user?.image;

  const handleStatusUpdate = async (status: string) => {
    setLoading(status);
    const res = await updateGlobalPrayerStatus(prayer.id, status);
    setLoading(null);
    if (res.success) {
      toast.success(res.message);
      onClose();
    } else {
      toast.error(res.message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col bg-gray-50/50 h-full">
        
        {/* --- HEADER --- */}
        <div className="p-6 bg-white border-b border-gray-100 shadow-sm z-10">
            <div className="flex items-start justify-between mb-4">
                <PrayerStatusBadge status={prayer.status} />
                <SheetClose className="rounded-full p-2 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </SheetClose>
            </div>
            
            <div className="space-y-1">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-pink-600 bg-pink-50 uppercase tracking-wider mb-2">
                    {prayer.subjectType}
                </span>
                <SheetTitle className="text-2xl md:text-3xl font-serif text-indigo-900 leading-tight">
                    Requête de prière
                </SheetTitle>
            </div>

            <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                <Calendar className="h-4 w-4 text-indigo-400" />
                <span>Reçue le {format(new Date(prayer.createdAt), "d MMMM yyyy à HH:mm", { locale: fr })}</span>
            </div>
        </div>

        {/* --- CONTENU SCROLLABLE --- */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* 1. Le Sujet */}
            <div className="relative group">
                <div className="absolute top-0 left-0 -ml-3 -mt-3 transition-transform group-hover:-translate-y-1">
                    <Quote className="h-10 w-10 text-indigo-100 rotate-180" />
                </div>
                <div className="relative z-10 bg-white p-6 rounded-2xl shadow-sm border border-indigo-50/50">
                    <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap font-serif">
                        {prayer.content}
                    </p>
                </div>
            </div>

            {/* 2. Informations Demandeur (Mise à jour avec Téléphone) */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">
                    Porteur de la requête
                </h4>
                
                <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border border-gray-100 shadow-sm">
                        <AvatarImage src={displayImage} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                            {displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-3 flex-1">
                        <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-900 text-lg leading-none">
                                {displayName}
                            </p>
                            {prayer.userId && (
                                <Badge variant="secondary" className="text-[10px] h-5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                                    Membre
                                </Badge>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                            {/* EMAIL */}
                            {displayEmail && (
                                <a href={`mailto:${displayEmail}`} className="flex items-center text-sm text-gray-600 hover:text-indigo-600 transition-colors group p-2 rounded-lg hover:bg-gray-50 -ml-2">
                                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md mr-3 group-hover:bg-indigo-100 transition-colors">
                                        <Mail className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="truncate">{displayEmail}</span>
                                </a>
                            )}

                            {/* TÉLÉPHONE (Ajouté ici) */}
                            {displayPhone ? (
                                <a href={`tel:${displayPhone}`} className="flex items-center text-sm text-gray-600 hover:text-indigo-600 transition-colors group p-2 rounded-lg hover:bg-gray-50 -ml-2">
                                    <div className="p-1.5 bg-pink-50 text-pink-600 rounded-md mr-3 group-hover:bg-pink-100 transition-colors">
                                        <Phone className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="font-medium">{displayPhone}</span>
                                </a>
                            ) : (
                                <div className="flex items-center text-sm text-gray-400 p-2 -ml-2 italic">
                                    <div className="p-1.5 bg-gray-100 rounded-md mr-3">
                                        <Phone className="h-3.5 w-3.5" />
                                    </div>
                                    Pas de numéro
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>

        {/* --- FOOTER (ACTIONS) --- */}
        <div className="p-6 bg-white border-t border-gray-100 mt-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button 
                    variant="outline" 
                    onClick={() => handleStatusUpdate("PENDING")}
                    disabled={prayer.status === "PENDING" || !!loading}
                    className={`h-11 ${prayer.status === "PENDING" ? "bg-amber-50 border-amber-200 text-amber-700" : "hover:bg-gray-50"}`}
                >
                    {loading === "PENDING" ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <div className={`w-2 h-2 rounded-full mr-2 ${prayer.status === "PENDING" ? "bg-amber-500" : "bg-gray-300"}`} />}
                    En attente
                </Button>

                <Button 
                    variant="outline" 
                    onClick={() => handleStatusUpdate("ANSWER")}
                    disabled={prayer.status === "ANSWER" || !!loading}
                    className={`h-11 ${prayer.status === "ANSWER" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"}`}
                >
                    {loading === "ANSWER" ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
                    Exaucé
                </Button>

                <Button 
                    variant="outline" 
                    onClick={() => handleStatusUpdate("FAILED")}
                    disabled={prayer.status === "FAILED" || !!loading}
                    className={`h-11 ${prayer.status === "FAILED" ? "bg-rose-50 border-rose-200 text-rose-700" : "hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"}`}
                >
                    {loading === "FAILED" ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <X className="mr-2 h-4 w-4" />}
                    Non exaucé
                </Button>
            </div>
        </div>

      </SheetContent>
    </Sheet>
  );
}