import { clsx, type ClassValue } from "clsx"
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const formatUtcDate = (dateInput: Date | string, formatStr: string) => {
  const date = new Date(dateInput);
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  // On compense le décalage pour retomber sur l'heure "pile" visuelle
  const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
  return format(adjustedDate, formatStr, { locale: fr });
};


export const normalizeDate = (dateInput: Date | string) => {
  const d = new Date(dateInput);
  return new Date(d.valueOf() + d.getTimezoneOffset() * 60000);
};

export const  convertKeepDate =(date: Date) => {
  return new Date(date.toUTCString().slice(0,-3))
}