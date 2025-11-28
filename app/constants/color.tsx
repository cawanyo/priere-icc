import { PrayerStatus, RequestStatus } from "@/app/generated/prisma";
import { Check, Clock, XCircle } from "lucide-react";

export const STATUS_LIST:PrayerStatus[] = ['PENDING', 'ANSWER', 'FAILED']


export const StatusProps : Record<PrayerStatus, any>= {
    PENDING: { 
      label: "En attente", 
      icon: <Clock className="w-3 h-3 mr-1" />,
      style: "bg-gradient-to-r from-purple-100  to-yellow-100 ", 
      text_style: " text-yellow-600 " 
    },
    ANSWER: { 
      label: "Exaucé", 
      icon: <Check className="w-3 h-3 mr-1" />, 
      style: "bg-gradient-to-r from-purple-100  to-green-100 ", 
      text_style: " text-green-600 " 
    },
    FAILED: { 
      label: "Non exaucé", 
      icon: <XCircle className="w-3 h-3 mr-1" />, 
      style: "bg-gradient-to-r from-purple-100  to-red-100 ", 
      text_style: " text-red-600  " 
    },
  };



  export const REQUEST_STATUS_LIST:RequestStatus[] = ['PENDING', "APPROVED", "REJECTED"]


export const RequestStatusProps : Record<RequestStatus, any>= {
    PENDING: { 
      label: "Pending", 
      icon: <Clock className="w-3 h-3 mr-1" />,
      style: "bg-gradient-to-r from-purple-100  to-yellow-100 ", 
      text_style: " text-yellow-600 " 
    },
    APPROVED: { 
      label: "Approuved", 
      icon: <Check className="w-3 h-3 mr-1" />, 
      style: "bg-gradient-to-r from-purple-100  to-green-100 ", 
      text_style: " text-green-600 " 
    },
    REJECTED: { 
      label: "Rejected", 
      icon: <XCircle className="w-3 h-3 mr-1" />, 
      style: "bg-gradient-to-r from-purple-100  to-red-100 ", 
      text_style: " text-red-600  " 
    },
  };
