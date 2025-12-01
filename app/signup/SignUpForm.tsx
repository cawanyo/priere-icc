// components/auth/SignupFormInner.tsx
"use client";

import { UseFormReturn } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, User } from "lucide-react";
import { SignupFormValues } from "@/lib/validations/auth";
import { PhoneInputCustom } from "@/components/ui/phone-input";
import { PasswordInput } from "@/components/ui/password-input";
import { IconInput } from "@/components/ui/text-input";


interface SignupFormInnerProps {
  form: UseFormReturn<SignupFormValues>;
  onHandleSubmit: (values: SignupFormValues) => Promise<void>;
  isLoading: boolean;
}

export function SignupFormInner({ form, onHandleSubmit, isLoading }: SignupFormInnerProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onHandleSubmit)} className="grid gap-4">
        {/* Champ Nom */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom complet </FormLabel>
                <FormControl>
                    <IconInput 
                        placeholder="Jean Dupont" 
                        startIcon={User} // Icône utilisateur à gauche
                        {...field} 
                        className="h-11" 
                        />
                </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Champ Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <IconInput
                  type="email"
                  placeholder="exemple@email.com"
                  startIcon={Mail} // Icône enveloppe à gauche
                  {...field}
                  className="h-11"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Champ Téléphone */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numéro de téléphone</FormLabel>
              <FormControl>
              <PhoneInputCustom
                  placeholder="Entrez votre numéro"
                  value={field.value}
                  onChange={field.onChange}
                  error={!!form.formState.errors.phone}
                  className="h-11" // On garde la même hauteur pour l'uniformité
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Champ Mot de passe */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <PasswordInput
                    placeholder="Créez un mot de passe"
                    {...field}
                    className="h-11"
                    />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Champ Confirmer le mot de passe */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe confirmé</FormLabel>
              <FormControl>
                <PasswordInput
                    placeholder="Confirmez votre mot de passe"
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
          Créer un compte
        </Button>
      </form>
    </Form>
  );
}