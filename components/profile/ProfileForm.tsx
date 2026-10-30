"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, Save, User, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PhoneInputCustom } from "@/components/ui/phone-input";
import { updateProfile } from "@/app/actions/profile";
import * as z from "zod";
import { profileSchema } from "@/lib/validations/auth";
import { IconInput } from "../ui/text-input";

type ProfileFormValues = z.infer<typeof profileSchema>;

const ROLE_DISPLAY: Record<string, string> = {
  PRAYER_LEADER: "Conducteur de prière",
  INTERCESSOR: "Conducteur de prière",
  LEADER: "Responsable",
  ADMIN: "Administrateur",
  REQUESTER: "Conducteur de prière",
};

interface ProfileFormProps {
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
    role: string;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
      phone: user.phone || "",
      email: user.email || "",
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);
    const result = await updateProfile(values);
    setIsLoading(false);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const roleLabel = ROLE_DISPLAY[user.role] ?? user.role;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nom complet */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-slate-700">Nom complet</FormLabel>
                <FormControl>
                  <IconInput
                    startIcon={User}
                    placeholder="Votre nom"
                    {...field}
                    className="h-10 text-xs rounded-xl border-slate-200"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-slate-700">Adresse email</FormLabel>
                <FormControl>
                  <IconInput
                    startIcon={Mail}
                    type="email"
                    placeholder="exemple@email.com"
                    {...field}
                    className="h-10 text-xs rounded-xl border-slate-200"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Téléphone */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-slate-700">Numéro de téléphone</FormLabel>
                <FormControl>
                  <PhoneInputCustom
                    placeholder="Votre numéro"
                    value={field.value}
                    onChange={field.onChange}
                    className="h-10 text-xs rounded-xl"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Rôle actuel (Lecture seule) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">Rôle sur la plateforme</label>
            <div className="flex items-center gap-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 font-medium">
              <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>{roleLabel}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            {isLoading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </Form>
  );
}
