'use client';
import { useState } from "react";
import Link from "next/link";
import { AuthHeader } from "../../../components/auth/AuthHeader";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Mail, ArrowLeft } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { validateForm } from "../../../utils/helpers/form-validator";
import { api } from "../../../services/api";
import { toast } from "sonner";
export default function ForgotPasswordPage() {
  const [formData, setFormData] = useState({
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
     if (!validateForm(formData,["email"])) return;

    try {
      await api.auth.forgotPassword(formData);
      toast.success("Un lien de réinitialisation de mot de passe a été envoyé à votre adresse e-mail.");
    } catch (err: unknown) {
  let errorMessage =
    "Une erreur s'est produite lors de l'envoi du lien de réinitialisation.";

  if (typeof err === "object" && err !== null && "response" in err) {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    errorMessage = axiosErr.response?.data?.message ?? errorMessage;
  }

  toast.error(errorMessage);
}

  };

  return (
    <Card className="w-full ">
      <AuthHeader 
        title="Mot de passe oublié?" 
        subtitle="Entrez votre email pour recevoir un lien de réinitialisation" 
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        
          <Input 
            id="email"
            type="email" 
            placeholder="exemple@dna.tn" 
            value={formData.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
            icon={<Mail className="w-5 h-5 text-gray-400 dark:text-flashscore-muted" />}
            label="Adresse email"
          />
        

        <Button 
          type="submit" 
          className="w-full" 
          variant="primary"
        >
          Envoyer le lien
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
