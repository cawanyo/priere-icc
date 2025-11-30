// components/prayer/PrayerRequestForm.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhoneInputCustom } from "@/components/ui/phone-input";

import { User, Mail } from "lucide-react";
import { IconInput } from "@/components/ui/text-input";
import { PrayerFormValues, prayerSchema } from "@/lib/validations/prayer";
import { User as UserType} from "@prisma/client";
import { useRouter } from "next/navigation";
export function PrayerRequestForm({user}: {user?:UserType}) {
  const router = useRouter()
  const form = useForm<PrayerFormValues>({
    resolver: zodResolver(prayerSchema),
    defaultValues: {
      subjectType: "",
      content: "",
      name: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.setValue("name", user.name || "");
      form.setValue("email", user.email || "");
      form.setValue("phone", user.phone || "");
    }
  }, [user, form]);

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: PrayerFormValues) => {
    try {
      const res = await fetch("/api/prayer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Erreur lors de la soumission");

      toast.success("Votre sujet de prière a été envoyé avec succès !");
      form.reset();
      router.push('/')
    } catch (error) {
      toast.error("Impossible d'envoyer la requête. Veuillez réessayer.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Type de sujet */}
        <FormField
          control={form.control}
          name="subjectType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sujet de la prière</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un sujet (ex: Famille)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Famille">Famille</SelectItem>
                  <SelectItem value="Santé">Santé / Guérison</SelectItem>
                  <SelectItem value="Travail">Travail / Études</SelectItem>
                  <SelectItem value="Finances">Finances</SelectItem>
                  <SelectItem value="Spirituel">Vie Spirituelle</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contenu */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Votre requête détaillée</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Décrivez votre situation ici pour que nous puissions prier spécifiquement..." 
                  className="min-h-[120px] resize-none"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-4">
            {/* Nom */}
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Votre Nom</FormLabel>
                <FormControl>
                    <IconInput startIcon={User} placeholder="Jean Dupont" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            {/* Email */}
            <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <IconInput startIcon={Mail} placeholder="jean@exemple.com" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        {/* Téléphone */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone</FormLabel>
              <FormControl>
                <PhoneInputCustom 
                    placeholder="Numéro de téléphone" 
                    value={field.value} 
                    onChange={field.onChange} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />}
          Envoyer ma requête
        </Button>
      </form>
    </Form>
  );
}