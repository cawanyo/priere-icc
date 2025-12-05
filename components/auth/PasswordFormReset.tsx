"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Mail, Smartphone, ArrowRight, CheckCircle2, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { findUserForReset, sendResetCode, resetPasswordWithCode } from "@/app/actions/auth-reset";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/ui/password-input"; // Votre composant existant

type Step = "FIND" | "SELECT" | "VERIFY" | "SUCCESS";

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("FIND");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [userData, setUserData] = useState<{ id: string; hasPhone: boolean; maskedEmail: string; maskedPhone: string } | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"email" | "sms">("email");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  // ÉTAPE 1 : Trouver l'utilisateur
  const handleFindUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await findUserForReset(email);
    setIsLoading(false);

    if (res.success && res.user) {
      setUserData(res.user);
      // Si pas de téléphone, on saute l'étape de choix et on envoie direct par email ? 
      // Ou on laisse l'utilisateur confirmer. Laissons le choix pour l'instant (même si un seul choix).
      setStep("SELECT");
    } else {
      toast.error(res.message);
    }
  };

  // ÉTAPE 2 : Envoyer le code
  const handleSendCode = async () => {
    if (!userData) return;
    setIsLoading(true);
    const res = await sendResetCode(userData.id, selectedMethod);
    setIsLoading(false);

    if (res.success) {
      toast.success(res.message);
      setStep("VERIFY");
    } else {
      toast.error(res.message);
    }
  };

  // ÉTAPE 3 : Vérifier et Changer
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!userData) return;

    setIsLoading(true);
    const res = await resetPasswordWithCode(userData.id, code, newPassword);
    setIsLoading(false);

    if (res.success) {
      setStep("SUCCESS");
    } else {
      toast.error(res.message);
    }
  };

  return (
    <Card className="w-full max-w-md border-none shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-serif font-bold text-indigo-900">
          {step === "SUCCESS" ? "Mot de passe modifié" : "Réinitialisation"}
        </CardTitle>
        <CardDescription>
          {step === "FIND" && "Entrez votre email pour retrouver votre compte."}
          {step === "SELECT" && "Comment souhaitez-vous recevoir le code ?"}
          {step === "VERIFY" && "Entrez le code reçu et votre nouveau mot de passe."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* --- STEP 1: FIND USER --- */}
        {step === "FIND" && (
          <form onSubmit={handleFindUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="exemple@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11 bg-pink-600 hover:bg-pink-700" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : "Rechercher"}
            </Button>
          </form>
        )}

        {/* --- STEP 2: SELECT METHOD --- */}
        {step === "SELECT" && userData && (
          <div className="space-y-6">
            <RadioGroup defaultValue="email" onValueChange={(v:any) => setSelectedMethod(v as "email" | "sms")}>
              
              {/* <div className={`flex items-center space-x-3 border p-4 rounded-lg cursor-pointer transition-colors ${selectedMethod === 'email' ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}>
                <RadioGroupItem value="email" id="r-email" />
                <Label htmlFor="r-email" className="flex-1 flex items-center gap-3 cursor-pointer">
                  <div className="bg-white p-2 rounded-full border">
                    <Mail className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Envoyer par Email</p>
                    <p className="text-xs text-gray-500">{userData.maskedEmail}</p>
                  </div>
                </Label>
              </div> */}

              {userData.hasPhone && (
                <div className={`flex items-center space-x-3 border p-4 rounded-lg cursor-pointer transition-colors ${selectedMethod === 'sms' ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}>
                  <RadioGroupItem value="sms" id="r-sms" />
                  <Label htmlFor="r-sms" className="flex-1 flex items-center gap-3 cursor-pointer">
                    <div className="bg-white p-2 rounded-full border">
                      <Smartphone className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Envoyer par SMS</p>
                      <p className="text-xs text-gray-500">{userData.maskedPhone}</p>
                    </div>
                  </Label>
                </div>
              )}
            </RadioGroup>

            <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep("FIND")}>Retour</Button>
                <Button className="flex-1 bg-pink-600 hover:bg-pink-700" onClick={handleSendCode} disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : "Envoyer le code"}
                </Button>
            </div>
          </div>
        )}

        {/* --- STEP 3: VERIFY & RESET --- */}
        {step === "VERIFY" && (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label>Code de vérification (6 chiffres)</Label>
              <Input 
                value={code} 
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                className="text-center text-xl tracking-widest h-12 font-mono"
                placeholder="000000"
                required
              />
            </div>
            
            <div className="space-y-2">
                <Label>Nouveau mot de passe</Label>
                <PasswordInput 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="••••••••"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label>Confirmer le mot de passe</Label>
                <PasswordInput 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="••••••••"
                    required
                />
            </div>

            <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("SELECT")}>Retour</Button>
                <Button type="submit" className="flex-1 bg-pink-600 hover:bg-pink-700" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : "Changer le mot de passe"}
                </Button>
            </div>
          </form>
        )}

        {/* --- STEP 4: SUCCESS --- */}
        {step === "SUCCESS" && (
          <div className="text-center space-y-6 py-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-900">Mot de passe mis à jour !</h3>
                <p className="text-gray-500 text-sm mt-1">
                    Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                </p>
            </div>
            <Button onClick={() => router.push("/login")} className="w-full bg-indigo-900 hover:bg-indigo-800">
                Aller à la connexion <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
      
      {step === "FIND" && (
        <CardFooter className="justify-center border-t pt-4">
            <Button variant="link" className="text-gray-500" onClick={() => router.push("/login")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la connexion
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}