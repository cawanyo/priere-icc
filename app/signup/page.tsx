"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { Heart, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";


import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { formSchema, SignupFormValues } from "@/lib/validations/auth";
import { SignupFormInner } from "./SignUpForm";
import ImageLeft from "./ImageLeft";


export default function SignupPage() {

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);


  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "", 
      password: "",
      confirmPassword: "",
    },
  });


  const handleSignup = async (values: SignupFormValues) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email || undefined, 
          phone: values.phone || undefined, 
          password: values.password,
          confirmPassword: values.confirmPassword
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.message.includes("User exists")) {
             form.setError("email", { 
                type: "manual", 
                message: "Un compte avec cet email ou ce numéro de téléphone existe déjà." 
             });
        }
        throw new Error(data.message || "Erreur lors de la création du compte.");
      }

      toast.success("Compte créé ! Connexion en cours...");

      // Auto-login: utilise l'email ou le téléphone comme identifiant
      const identifier = values.email || values.phone; 
      
      const loginResult = await signIn("credentials", {
        identifier: identifier, 
        password: values.password,
        redirect: false,
      });

      if (loginResult?.ok) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    } catch (error: any) {
      if (error.message && !error.message.includes("User exists")) {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      
     
      
      {/* --- LEFT SIDE: IMAGE --- */}
      <ImageLeft />

      {/* --- RIGHT SIDE: FORM --- */}
      <div className="flex items-center justify-center py-12 px-8 bg-background">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto grid w-full max-w-[400px] gap-6"
        >
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-serif font-bold">Create an Account</h1>
          </div>

          <div className="grid gap-4">
            {/* Form */}
             <SignupFormInner
                    form={form} 
                    onHandleSubmit={handleSignup} 
                    isLoading={isLoading} 
              />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button variant="outline" className="w-full h-11" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </Button>
          </div>

          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline font-medium text-primary">
              Log in
            </Link>
          </div>

          <Button variant="link" className="mt-2 w-fit mx-auto text-muted-foreground" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </motion.div>
      </div>
    </div>
  );
}