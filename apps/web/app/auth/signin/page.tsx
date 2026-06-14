'use client';
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthHeader } from "../../../components/auth/AuthHeader";
import { AuthFooter } from "../../../components/auth/AuthFooter";
import { Form, FormField } from "../../../components/ui/Form";
import { Button } from "../../../components/ui/Button";
import { Mail, Lock } from "lucide-react";
import { api } from "../../../services/api";
import { useUser } from "../../../hooks/useUser";
import { Card } from "../../../components/ui/Card";
import { validateForm } from "../../../utils/helpers/form-validator";
import { toast } from "sonner";
import { User } from "../../../types/user";


const SignInPage = () => {
  const { login, refreshUser } = useUser();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formFields: FormField[] = [
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "exemple@dna.tn",
      icon: <Mail className="w-5 h-5 text-gray-400 dark:text-flashscore-muted" />
    },
    {
      name: "password",
      label: "Mot de passe",
      type: "password",
      placeholder: "••••••••",
      icon: <Lock className="w-5 h-5 text-gray-400 dark:text-flashscore-muted" />
    }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm({ email: formData.email, passwordSignin: formData.password }, ["email", "passwordSignin"])) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.auth.login(formData);
      const accessToken = response.data?.access_token;
      const user = response.data?.user;

      if (accessToken && user) {
        login(user as User, accessToken);
        await refreshUser();
        toast.success("Connexion réussie avec succès.");
        if (user.role === "ADMIN_DNA" || user.role === "CAA" || user.role === "CRA" || user.role === "CAJ" || user.role === "CAF") {
          router.push("/admin/dashboard");
        } else if (user.role === "DESIGNATION_DNA" || user.role === "FINANCE_DNA") {
          router.push("/admin/planning");
        } else if (user.role === "ARBITRE") {
          router.push("/referee/dashboard");
        }else if (user.role === "CDC") {
          router.push("/admin/inspecteurs");
        }else {
          router.push("/");
        }
      } else {
        console.error("Les tokens ne sont pas présents dans la réponse :", response.data);
        toast.error("La connexion a réussi, mais les jetons n'ont pas été reçus.");
      }
    } catch (err) {
      // Safe type-safe error extraction
      let errorMessage = "Une erreur est survenue lors de la connexion.";

      if (err && typeof err === "object" && "response" in err) {
        const maybeResponse = (err as { response?: { data?: { message?: string } } }).response;
        if (maybeResponse?.data?.message) {
          errorMessage = maybeResponse.data.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full ">
      <AuthHeader
        title="Bienvenue"
        subtitle="Connectez-vous à votre compte DNA"
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Form
          fields={formFields}
          formData={formData}
          onChange={handleChange}
          className="!grid-cols-1 !md:grid-cols-1 gap-y-4"
        />

        <div className="flex justify-end">
          <Link
            href="/auth/forgot-pass"
            className="text-sm font-medium text-[#ce1126] hover:text-[#a20e1f] hover:underline"
          >
            Mot de passe oublié?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          variant="primary"
          disabled={isLoading}
        >
          {isLoading ? "Connexion en cours..." : "Se connecter"}
        </Button>
      </form>

      <AuthFooter />
    </Card>
  );
};

export default SignInPage;