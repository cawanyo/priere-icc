// components/auth/LoginFormInner.tsx
"use client";

import { UseFormReturn } from "react-hook-form";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2, Mail } from "lucide-react";

import { PasswordInput } from "@/components/ui/password-input";
import { LoginFormValues } from "@/lib/validations/auth";
import { IconInput } from "@/components/ui/text-input";

interface LoginFormInnerProps {
  form: UseFormReturn<LoginFormValues>;
  onHandleSubmit: (values: LoginFormValues) => Promise<void>;
  isLoading: boolean;
}

export function LoginFormInner({ form, onHandleSubmit, isLoading }: LoginFormInnerProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onHandleSubmit)} className="grid gap-4">
        
        {/* Champ Email avec Icône */}
        <FormField
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <IconInput
                  type="email"
                  placeholder="exemple@email.com"
                  startIcon={Mail}
                  {...field}
                  className="h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Champ Mot de passe avec Lien "Oublié ?" */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Mot de passe</FormLabel>
                <Link
                  href="forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <FormControl>
                <PasswordInput
                  placeholder="Entrez votre mot de passe"
                  {...field}
                  className="h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full h-11" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Se connecter
        </Button>
      </form>
    </Form>
  );
}