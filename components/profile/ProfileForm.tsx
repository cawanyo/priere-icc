// components/dashboard/profile/ProfileForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, Save, User, Mail, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { PhoneInputCustom } from "@/components/ui/phone-input";
import { updateProfile,} from "@/app/actions/profile";
import * as z from "zod";
import { profileSchema } from "@/lib/validations/auth";
import { IconInput } from "../ui/text-input";

type ProfileFormValues = z.infer<typeof profileSchema>;

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Champs en lecture seule */}
        <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <FormLabel className="text-muted-foreground">Adresse Email</FormLabel>
                <div className="flex items-center h-11 w-full rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                    <Mail className="mr-2 h-4 w-4 opacity-50" />
                    {user.email}
                </div>
            </div>
            <div className="space-y-2">
                <FormLabel className="text-muted-foreground">Rôle</FormLabel>
                <div className="flex items-center h-11 w-full rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                    <Shield className="mr-2 h-4 w-4 opacity-50" />
                    {user.role}
                </div>
            </div>
        </div>

        <div className="border-t my-4" />

        {/* Champs modifiables */}
        <div className="grid md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nom complet</FormLabel>
                <FormControl>
                    <IconInput startIcon={User} placeholder="Votre nom" {...field} className="h-11" />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl>
                    <PhoneInputCustom 
                        placeholder="Votre numéro" 
                        value={field.value} 
                        onChange={field.onChange}
                        className="h-11"
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Enregistrer les modifications
            </Button>
        </div>
      </form>
    </Form>
  );
}