"use client";

import { useEffect } from "react";
import Link from "next/link";
import BackButton from "../components/ui/BackButton";
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-white dark:bg-flashscore-card px-6 text-gray-900 dark:text-flashscore-text">
      <div
        role="alert"
        aria-live="assertive"
        className="w-full max-w-lg text-center flex flex-col items-center"
      >
        <span className="text-[#ce1126] text-xs font-semibold uppercase tracking-widest px-4 py-1 border border-[#ce1126]/20 bg-[#ce1126]/10 rounded-full mb-6">
          Erreur 500
        </span>

        <p className="text-6xl font-extrabold mb-3">500</p>

        <h1 className="text-xl font-semibold mb-3">
          Une erreur est survenue
        </h1>

        <p className="text-gray-600 dark:text-gray-400 dark:text-flashscore-muted max-w-md mb-8 leading-relaxed">
          Une erreur inattendue s’est produite lors du chargement de cette page.
          Vous pouvez réessayer ou revenir à une page sécurisée.
        </p>

        {error?.digest && (
          <p className="text-xs font-mono text-gray-500 dark:text-gray-400 dark:text-flashscore-muted bg-gray-50 dark:bg-flashscore-hover border border-gray-200 dark:border-flashscore-border rounded-lg px-3 py-2 mb-6 break-words">
            Référence : {error.digest}
          </p>
        )}

        <div className="flex gap-3 flex-wrap justify-center w-full">
          <button
            onClick={() => reset()}
            className="bg-[#ce1126] hover:bg-[#b00f20] text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            Réessayer
          </button>

          <Link
            href="/auth/signin"
            className="border border-gray-300 dark:border-flashscore-border hover:bg-gray-50 dark:bg-flashscore-hover px-6 py-3 rounded-lg font-semibold"
          >
            Aller à la connexion
          </Link>

          <BackButton />
        </div>
      </div>
    </main>
  );
}