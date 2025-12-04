import { ForgotPasswordForm } from "@/components/auth/PasswordFormReset";
import { Heart } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      
      <div className="mb-8 flex items-center gap-2">
        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center p-[2px]">
            <div className="bg-white rounded-full h-full w-full flex items-center justify-center">
                <Heart className="h-5 w-5 text-pink-600 fill-current" />
            </div>
        </div>
        <span className="font-serif font-bold text-2xl text-indigo-900">ICC Prière</span>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}