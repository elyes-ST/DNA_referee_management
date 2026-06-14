'use client';
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Lock, ArrowLeft } from "lucide-react";

import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import {AuthHeader} from "./AuthHeader";
import { api } from "../../services/api";
import { validateForm } from "../../utils/helpers/form-validator";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(formData ,["password" , "confirmPassword"])) return;
     const token = searchParams.get("token");

    if (!token) {
      toast.error("Jeton de réinitialisation invalide ou manquant.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas !");
      return;
    }

    try {
      await api.auth.resetPassword( { token: token,newPassword: formData.password });
      toast.success("Votre mot de passe a été réinitialisé avec succès.");
      router.push("/auth/signin");
    } catch (err: unknown) {
  let errorMessage =
    "Une erreur s'est produite lors de la réinitialisation de votre mot de passe.";

  if (typeof err === "object" && err !== null && "response" in err) {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    errorMessage = axiosErr.response?.data?.message ?? errorMessage;
  }

  toast.error(errorMessage);
}

  };

  return (
    <Card className="w-full">
      <AuthHeader 
        title="Nouveau mot de passe" 
        subtitle="Créez un nouveau mot de passe sécurisé pour votre compte" 
      />

      <form onSubmit={handleSubmit} className="space-y-4">
           <Input 
            id="password"
            type="password" 
            placeholder="••••••••" 
            value={formData.password}
            onChange={handleChange}
            icon={<Lock className="w-5 h-5 text-gray-400 dark:text-flashscore-muted" />}
            label="Nouveau mot de passe"
          />


        <div className="bg-gray-50 dark:bg-flashscore-hover p-4 rounded-md space-y-2 border border-gray-100 dark:border-flashscore-border">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mb-2">Critères du mot de passe:</p>
            <ul className="space-y-1.5">
                {[
                    "Au moins 8 caractères",
                    "Une lettre majuscule",
                    "Une lettre minuscule",
                    "Un chiffre"
                ].map((req, i) => (
                    <li key={i} className="flex items-center text-xs text-gray-600 dark:text-gray-400 dark:text-flashscore-muted">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2" />
                        {req}
                    </li>
                ))}
            </ul>
        </div>


           <Input 
            id="confirmPassword"
            type="password" 
            placeholder="••••••••" 
            value={formData.confirmPassword}
            onChange={handleChange}
            icon={<Lock className="w-5 h-5 text-gray-400 dark:text-flashscore-muted" />}
            label="Confirmer le mot de passe"
          />


        <Button 
          type="submit" 
          className="w-full mt-4 bg-[#ce1126]/60 hover:bg-[#ce1126] transition-colors" 
          variant="primary"
        >
          Réinitialiser le mot de passe
        </Button>

         <div className="text-center mt-4">
             <Link 
                href="/auth/signin" 
                className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-flashscore-muted hover:text-gray-900 dark:text-flashscore-text transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la connexion
            </Link>
        </div>
      </form>
    </Card>
  );
}
