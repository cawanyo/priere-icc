// components/dashboard/profile/IntercessorJourney.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Clock, UserCheck, X, Crown, Loader2, Trash2 } from "lucide-react";
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

interface JourneyProps {
  userRole: string;
  requestStatus: string | null; // "PENDING", "LEADER_APPROVED", "REJECTED" ou null
}

const STEPS = [
  { id: "REQUESTER", label: "Demandeur", icon: UserCheck },
  { id: "PENDING", label: "En attente", icon: Clock },
  { id: "LEADER_APPROVED", label: "Validé par Leader", icon: Check },
  { id: "INTERVIEW", label: "Entretien Pasteur", icon: UserCheck }, // Étape visuelle
  { id: "INTERCESSOR", label: "Intercesseur", icon: Crown },
];

export function IntercessorJourney({ userRole, requestStatus }: JourneyProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Déterminer l'étape active pour la barre de progression
  const getCurrentStepIndex = () => {
    if (userRole === "INTERCESSOR") return 4;
    if (requestStatus === "LEADER_APPROVED") return 2; // On considère que l'étape 3 (Interview) est la prochaine
    if (requestStatus === "PENDING") return 1;
    return 0;
  };

  const currentStep = getCurrentStepIndex();
  const isRejected = requestStatus === "REJECTED";

  const handleCreateRequest = async () => {
    setIsLoading(true);
    const res = await createRoleRequest();
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

  // Si l'utilisateur est déjà intercesseur ou n'a pas fait de demande
  if (userRole !== "INTERCESSOR" && !requestStatus) {
    return (
      <div className="text-center py-10 space-y-6">
        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
          <Crown className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-indigo-900">Devenir Intercesseur</h3>
          <p className="text-muted-foreground max-w-md mx-auto mt-2">
            Rejoignez l'équipe d'intercession pour porter les sujets de l'église. 
            Ce rôle nécessite une validation par les leaders et le pasteur.
          </p>
        </div>
        <Button onClick={handleCreateRequest} disabled={isLoading} className="bg-pink-500 hover:bg-pink-600">
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
          Soumettre ma candidature
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      
      <div className="flex items-center justify-between">
        <div>
            <h3 className="text-lg font-semibold text-indigo-900">Suivi de votre candidature</h3>
            <p className="text-sm text-muted-foreground">Voici les étapes pour rejoindre le ministère.</p>
        </div>
        
        {/* Bouton d'annulation (si pas encore intercesseur) */}
        {userRole !== "INTERCESSOR" && (
            <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50">
                    <Trash2 className="w-4 h-4 mr-2" /> Annuler la demande
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                    Cela annulera votre processus de candidature actuel. Vous devrez recommencer depuis le début.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Retour</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRequest} className="bg-red-600 hover:bg-red-700 text-white">
                    Confirmer l'annulation
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialog>
        )}
      </div>

      {/* --- LA ROUTE (ROADMAP) --- */}
      <div className="relative">
        {/* Barre de progression grise (fond) */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full" />
        
        {/* Barre de progression colorée (active) */}
        <motion.div 
            className={`absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full ${isRejected ? 'bg-red-500' : 'bg-green-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
        />

        {/* Étapes (Points) */}
        <div className="relative flex justify-between w-full">
          {STEPS.map((step, index) => {
            const isCompleted = index <= currentStep;
            const isCurrent = index === currentStep;
            const isLast = index === STEPS.length - 1;

            let Icon = step.icon;
            let statusColor = isCompleted ? (isRejected && isCurrent ? "bg-red-500 border-red-500" : "bg-green-500 border-green-500") : "bg-white border-gray-200";
            let iconColor = isCompleted ? "text-white" : "text-gray-400";

            if (isRejected && isCurrent) Icon = X; // Changer l'icône si rejeté

            return (
              <div key={step.id} className="flex flex-col items-center relative z-10 group">
                
                {/* Cercle de l'étape */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors duration-500 ${statusColor}`}
                >
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </motion.div>

                {/* Label */}
                <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 + 0.1 }}
                    className={`absolute top-14 text-xs sm:text-sm font-medium whitespace-nowrap ${isCurrent ? 'text-indigo-900 font-bold' : 'text-gray-500'}`}
                >
                  {step.label}
                </motion.span>
                
                {/* Badge d'état spécifique pour l'étape actuelle */}
                {isCurrent && !isLast && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`absolute -top-8 px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider ${isRejected ? 'bg-red-500' : 'bg-blue-500'}`}
                    >
                        {isRejected ? "Refusé" : "En cours"}
                    </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

        {/* Message d'état textuel */}
        <div className="mt-16 bg-gray-50 p-4 rounded-lg border border-gray-100 text-center text-sm text-gray-600">
            {isRejected ? (
                <span className="text-red-600 font-medium">Votre demande a été refusée. Vous pouvez l'annuler pour en soumettre une nouvelle ultérieurement.</span>
            ) : userRole === "INTERCESSOR" ? (
                <span className="text-green-600 font-medium">Félicitations ! Vous êtes officiellement Intercesseur.</span>
            ) : requestStatus === "LEADER_APPROVED" ? (
                "Votre demande a été validée par un leader. Vous serez bientôt contacté pour un entretien."
            ) : (
                "Votre demande est en cours d'examen par l'équipe des leaders."
            )}
        </div>
    </div>
  );
}