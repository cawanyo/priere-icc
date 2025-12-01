"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Clock, UserCheck, X, Crown, Loader2, Trash2, Mic2, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createRoleRequest, deleteRoleRequest } from "@/app/actions/role-request";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card } from "../ui/card";

interface JourneyProps {
  userRole: string;
  requestStatus: string | null;
  requestedRole?: string | null;
}

// Configuration des étapes pour l'Intercesseur
const STEPS_INTERCESSOR = [
  { id: "REQUESTER", label: "Demandeur", icon: UserCheck },
  { id: "PENDING", label: "En attente", icon: Clock }, // Terme plus spirituel que "En attente"
  { id: "APPROVED", label: "Intercesseur", icon: Crown },
];

// Configuration des étapes pour le Conducteur (Avec Audition)
const STEPS_PRAYER_LEADER = [
  { id: "REQUESTER", label: "Demandeur", icon: UserCheck },
  { id: "PENDING", label: "En attente", icon: Mic2 }, // Étape spécifique !
  { id: "APPROVED", label: "Conducteur de Prière", icon: Mic2 },
];

export function IntercessorJourney({ userRole, requestStatus, requestedRole }: JourneyProps) {
  const [isLoading, setIsLoading] = useState(false);

  // 1. DÉTERMINER LE RÔLE CIBLÉ
  // Si l'utilisateur a déjà un rôle, c'est celui-là. Sinon, c'est celui qu'il demande.
  const targetRole = 
    (userRole === "PRAYER_LEADER" || requestedRole === "PRAYER_LEADER") 
    ? "PRAYER_LEADER" 
    : "INTERCESSOR";

  // 2. SÉLECTIONNER LA BONNE ROUTE
  const steps = targetRole === "PRAYER_LEADER" ? STEPS_PRAYER_LEADER : STEPS_INTERCESSOR;

  // 3. CALCULER L'AVANCEMENT
  const getCurrentStepIndex = () => {
    // Cas final : L'utilisateur A le rôle
    if (userRole === "INTERCESSOR" || userRole === "PRAYER_LEADER" || userRole === "LEADER") return 2;
    
    // Cas intermédiaire : Demande en cours (PENDING ou tout autre statut intermédiaire futur)
    if (requestStatus && requestStatus !== "REJECTED") return 1;
    
    // Cas échec : Rejeté (on reste bloqué à l'étape 1 pour montrer où ça a coincé)
    if (requestStatus === "REJECTED") return 1;

    // Cas initial : Rien fait
    return 0;
  };

  const currentStep = getCurrentStepIndex();
  console.log(userRole)
  const isRejected = requestStatus === "REJECTED";

  const handleCreateRequest = async (role: "INTERCESSOR" | "PRAYER_LEADER") => {
    setIsLoading(true);
    const res = await createRoleRequest(role);
    setIsLoading(false);
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
  };

  const handleDeleteRequest = async () => {
    setIsLoading(true);
    const res = await deleteRoleRequest();
    setIsLoading(false);
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
  };

  // --- ÉCRAN DE CHOIX (Si aucune demande) ---
  if (userRole === "REQUESTER" && !requestStatus) {
    return (
      <div className="space-y-8 py-6 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
            <h3 className="text-xl font-serif font-bold text-indigo-900">Rejoindre le Ministère</h3>
            <p className="text-muted-foreground">Choisissez votre voie de service.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
            {/* CARTE CONDUCTEUR */}
            <Card className="p-6 border-indigo-100 hover:border-indigo-300 transition-all cursor-pointer group flex flex-col items-center text-center space-y-4 hover:shadow-md bg-white">
                <div className="h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <Mic2 className="h-8 w-8 text-indigo-600" />
                </div>
                <div>
                    <h4 className="font-bold text-lg text-indigo-900">Conducteur de Prière</h4>
                    <p className="text-sm text-gray-500 mt-2">
                        Conduire les temps de prière, en ligne ou en présentiel?<br/>
                        <span className="text-xs font-semibold text-indigo-500">(Rejoignez nous)</span>
                    </p>
                </div>
                <Button 
                    onClick={() => handleCreateRequest("PRAYER_LEADER")} 
                    disabled={isLoading} 
                    variant="outline"
                    className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                    {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                    Postuler
                </Button>
            </Card>

            {/* CARTE INTERCESSEUR */}
            <Card className="p-6 border-pink-100 hover:border-pink-300 transition-all cursor-pointer group flex flex-col items-center text-center space-y-4 hover:shadow-md bg-white">
                <div className="h-16 w-16 rounded-full bg-pink-50 flex items-center justify-center group-hover:bg-pink-100 transition-colors">
                    <Crown className="h-8 w-8 text-pink-600" />
                </div>
                <div>
                    <h4 className="font-bold text-lg text-pink-900">Intercesseur</h4>
                    <p className="text-sm text-gray-500 mt-2">
                        Engagez-vous dans la prière d'intercession pour soutenir l'église.<br/>
                        <span className="text-xs font-semibold text-pink-600">(Vous devenez automatique conducteur de prière aussi)</span>
                    </p>
                </div>
                <Button 
                    onClick={() => handleCreateRequest("INTERCESSOR")} 
                    disabled={isLoading} 
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                >
                    {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                    Postuler 
                </Button>
            </Card>
        </div>
      </div>
    );
  }

  // --- ÉCRAN DE SUIVI ---
  const roleLabel = targetRole === "PRAYER_LEADER" ? "Conducteur" : "Intercesseur";
  const statusColorClass = targetRole === "PRAYER_LEADER" ? "text-indigo-600" : "text-pink-600";

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h3 className="text-lg font-semibold text-gray-900">
                Parcours : <span className={`font-bold ${statusColorClass}`}>{roleLabel}</span>
            </h3>
            <p className="text-sm text-muted-foreground">Suivez l'avancement de votre intégration.</p>
        </div>
        
        {userRole === "REQUESTER" && requestStatus && (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto">
                        <Trash2 className="w-4 h-4 mr-2" /> 
                        {isRejected ? "Effacer la demande" : "Annuler ma candidature"}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Abandonner le processus ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Cette action est irréversible. Vous devrez recommencer le processus depuis le début si vous changez d'avis.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Retour</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteRequest} className="bg-red-600 hover:bg-red-700 text-white">Confirmer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
      </div>

      {/* --- ROADMAP DYNAMIQUE --- */}
      <div className="relative mt-8 sm:mt-12 px-4 sm:px-0">
        
        {/* BARRES DE PROGRESSION */}
        <div className="absolute left-[19px] top-0 bottom-0 w-1 bg-gray-100 rounded-full sm:hidden" />
        <motion.div 
            className={`absolute left-[19px] top-0 w-1 rounded-full sm:hidden ${isRejected ? 'bg-red-500' : (targetRole === 'PRAYER_LEADER' ? 'bg-indigo-500' : 'bg-pink-500')}`}
            initial={{ height: 0 }}
            animate={{ height: `${(currentStep / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
        />

        <div className="hidden sm:block absolute top-[20px] left-0 w-full h-1 bg-gray-100 rounded-full" />
        <motion.div 
            className={`hidden sm:block absolute top-[20px] left-0 h-1 rounded-full ${isRejected ? 'bg-red-500' : (targetRole === 'PRAYER_LEADER' ? 'bg-indigo-500' : 'bg-pink-500')}`}
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
        />

        <div className="relative flex flex-col sm:flex-row justify-between w-full h-full gap-8 sm:gap-0">
          {steps.map((step, index) => {
            const isCompleted = index <= currentStep;
            const isCurrent = index === currentStep;
            const isLast = index === steps.length - 1;

            let Icon = step.icon;
            
            // Couleur dynamique selon le rôle (Indigo pour Conducteur, Rose pour Intercesseur)
            const activeColor = targetRole === "PRAYER_LEADER" ? "border-indigo-500 bg-indigo-500" : "border-pink-500 bg-pink-500";
            
            let statusColor = isCompleted 
                ? (isRejected && isCurrent ? "bg-red-500 border-red-500" : activeColor) 
                : "bg-white border-gray-200";
            
            let iconColor = isCompleted ? "text-white" : "text-gray-400";

            if (isRejected && isCurrent) Icon = X;

            return (
              <div key={step.id} className="flex sm:flex-col items-center relative z-10 group gap-4 sm:gap-0">
                
                {/* Cercle */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors duration-500 shrink-0 ${statusColor}`}
                >
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </motion.div>

                {/* Textes */}
                <div className="flex flex-col justify-center sm:items-center sm:absolute sm:top-14 sm:w-32">
                    <motion.span 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.2 + 0.1 }}
                        className={`text-sm font-medium ${isCurrent ? 'text-gray-900 font-bold' : 'text-gray-500'} sm:text-center`}
                    >
                        {step.label}
                    </motion.span>
                    
                    {/* Badge d'état */}
                    {isCurrent && !isLast && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`mt-1 w-fit px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider sm:mt-2 ${isRejected ? 'bg-red-500' : (targetRole === 'PRAYER_LEADER' ? 'bg-indigo-500' : 'bg-pink-500')}`}
                        >
                            {isRejected ? "Refusé" : "En cours"}
                        </motion.div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 sm:mt-24 bg-gray-50 p-4 rounded-lg border border-gray-100 text-center text-sm text-gray-600">
            {isRejected ? (
                <span className="text-red-600 font-medium">
                    Votre candidature a été refusée. N'hésitez pas à en discuter avec un responsable.
                </span>
            ) : userRole !== "REQUESTER" ? (
                <span className={`font-medium ${targetRole === 'PRAYER_LEADER' ? 'text-indigo-600' : 'text-pink-600'}`}>
                    Félicitations ! Vous avez rejoint l'équipe en tant que {roleLabel}.
                </span>
            ) : (
                targetRole === "PRAYER_LEADER" 
                    ? "Votre demande d'audition est en cours de traitement. Un responsable vous contactera."
                    : "Votre demande de discernement est en cours d'examen."
            )}
      </div>
    </div>
  );
}