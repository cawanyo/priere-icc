"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createTestimony } from "@/app/actions/testimony";
import { AudioRecorder } from "@/components/ui/audio-recorder";
import { ImageUploader } from "@/components/ui/image-uploader";
import { toast } from "sonner";
import { Loader2, Send, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { $Enums } from "@prisma/client";
import { useRouter } from "next/navigation";

// Schéma Zod Client
const formSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  content: z.string().optional(),
  audioBlob: z.custom<Blob>((v) => v === null || v instanceof Blob, "Format audio invalide").optional(),
  images: z.array(z.custom<File>()).optional(),
}).refine((data) => {
  // Validation croisée : Texte OU Audio requis
  const hasText = data.content && data.content.trim().length > 0;
  const hasAudio = data.audioBlob && data.audioBlob.size > 0;
  return hasText || hasAudio;
}, {
  message: "Veuillez écrire un message ou enregistrer un audio pour témoigner.",
  path: ["content"], // L'erreur s'attachera au champ 'content'
});

type TestimonyFormValues = z.infer<typeof formSchema>;

export function TestimonyForm() {
  const { data: session } = useSession();
  const router = useRouter()
  const form = useForm<TestimonyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      content: "",
      audioBlob: undefined,
      images: [],
    },
  });

  const images = form.watch("images");

  // Pré-remplissage du nom si connecté
  useEffect(() => {
    if (session?.user?.name) {
      form.setValue("name", session.user.name);
    }
  }, [session, form]);

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: TestimonyFormValues) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("content", values.content?? "");
    
    if (values.audioBlob) {
      formData.append("audio", values.audioBlob, "temoignage.webm");
    }

    if (values.images && values.images.length > 0) {
      values.images.forEach((file) => {
        formData.append("images", file);
      });
    }

    const res = await createTestimony(formData);
    if (res.success) {
      toast.success(res.message);
      // Reset complet du formulaire (y compris les composants customs si possible, sinon recharger la page ou gérer un état de reset local dans les enfants)
      form.reset({
        name: session?.user?.name || "",
        content: "",
        audioBlob: undefined,
        images: [],
      });
      // Note: Pour vider visuellement AudioRecorder et ImageUploader, l'idéal est d'exposer une ref ou une prop 'reset', ou simplement de laisser la page se rafraîchir si on redirige.
      // Ici, comme on reste sur la page, les composants enfants ne se videront pas automatiquement sauf si on les force (via une clé unique par exemple).
      router.push('/testimonies')
    } else {
      toast.error(res.message);
    }
  };

  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-6 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Champ Nom */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Votre Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Jean Dupont" {...field} className="bg-gray-50 border-gray-200" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Champ Contenu Texte */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Votre Témoignage (Écrit)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Racontez-nous ce que Dieu a fait..." 
                      className="min-h-[120px] bg-gray-50 border-gray-200 resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Affichage de l'erreur globale si ni texte ni audio */}
            {form.formState.errors.content && form.formState.errors.content.message?.includes("Veuillez écrire") && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {form.formState.errors.content.message}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Composant Audio */}
              <div className="space-y-2">
                <FormLabel>Témoignage Audio</FormLabel>
                <FormControl>
                    <AudioRecorder 
                        onAudioCaptured={(blob) => {
                            form.setValue("audioBlob", blob || undefined, { shouldValidate: true });
                        }} 
                    />
                </FormControl>
              </div>

              {/* Composant Images */}
              <div className="space-y-2">
                <FormLabel>Ajouter des photos</FormLabel>
                <FormControl>
                  <ImageUploader 
                      files={images || []} // On passe l'état actuel
                      onChange={(newFiles) => {
                          form.setValue("images", newFiles); // On met à jour l'état
                      }} 
                  />
                </FormControl>
              </div>
            </div>

            <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 h-11 text-lg font-medium" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
              Envoyer mon témoignage
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}