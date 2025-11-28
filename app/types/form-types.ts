// src/types/form-types.ts
import { FieldValues, UseControllerProps } from "react-hook-form";
import { LucideIcon } from "lucide-react";

/** Types de champs de formulaire supportés */
export enum FormFieldType {
    INPUT = 'input',
    TEXTAREA = 'textarea',
    PHONE = 'phone',
    PASSWORD = 'password',
    DATE = 'date',
    TIME = 'time',
    SELECT = 'select',
    CHECKBOX = 'checkbox',
}

/** Options pour les champs Select */
export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

/** Propriétés de base communes à tous les champs */
export interface BaseFieldProps<TFieldValues extends FieldValues> extends UseControllerProps<TFieldValues> {
    type: FormFieldType;
    label: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string; // Pour le style du conteneur
    icon?: LucideIcon;  // Icône optionnelle de Lucide
}

/** Propriétés spécifiques pour les champs avec options (Select) */
export interface SelectFieldProps<TFieldValues extends FieldValues> extends BaseFieldProps<TFieldValues> {
    type: FormFieldType.SELECT;
    options: SelectOption[];
}

/** Propriétés génériques pour le rendu */
export type FormFieldProps<TFieldValues extends FieldValues> =
    | BaseFieldProps<TFieldValues>
    | SelectFieldProps<TFieldValues>;