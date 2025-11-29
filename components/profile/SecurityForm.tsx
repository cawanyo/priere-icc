// components/dashboard/profile/SecurityForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { updatePassword} from "@/app/actions/profile";
import * as z from "zod";
import { passwordSchema } from "@/lib/validations/auth";

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function SecurityForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: PasswordFormValues) => {
    setIsLoading(true);
    const result = await updatePassword(values);
    setIsLoading(false);

    if (result.success) {
      toast.success(result.message);
      form.reset(); // Réinitialiser le formulaire après succès
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
        
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe actuel</FormLabel>
              <FormControl>
                <PasswordInput placeholder="••••••••" {...field} className="h-11" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
            <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nouveau mot de passe</FormLabel>
                <FormControl>
                    <PasswordInput placeholder="••••••••" {...field} className="h-11" />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Confirmer</FormLabel>
                <FormControl>
                    <PasswordInput placeholder="••••••••" {...field} className="h-11" />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="flex justify-end">
            <Button type="submit" variant="destructive" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
            Changer le mot de passe
            </Button>
        </div>
      </form>
    </Form>
  );
}