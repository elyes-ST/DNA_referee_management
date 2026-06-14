import Link from "next/link";
import BackButton from "../components/ui/BackButton";
export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white dark:bg-flashscore-card px-6 text-gray-900 dark:text-flashscore-text">
      <div className="text-center max-w-lg w-full flex flex-col items-center">
        <p className="text-6xl font-extrabold mb-3">404</p>

        <h1 className="text-xl font-semibold mb-3">
          Page introuvable
        </h1>

        <p className="text-gray-600 dark:text-gray-400 dark:text-flashscore-muted mb-8">
          La page demandée n’existe pas ou a été déplacée.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
            <BackButton />

          <Link
            href="/auth/signin"
            className="bg-[#ce1126] text-white hover:bg-[#b00f20] px-6 py-3 rounded-lg font-semibold"
          >
            Connexion
          </Link>
        </div>
      </div>
    </main>
  );
}