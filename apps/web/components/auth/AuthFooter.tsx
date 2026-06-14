import Link from "next/link";

export const AuthFooter = () => {
  return (
    <p className="text-center text-xs text-gray-500 dark:text-gray-400 dark:text-flashscore-muted mt-8 leading-relaxed max-w-sm mx-auto">
      En vous connectant, vous acceptez nos{" "}
      <Link href="#" className="font-medium text-[#ce1126] hover:underline hover:text-[#a20e1f]">
        conditions d'utilisation
      </Link>{" "}
      et notre{" "}
      <Link href="#" className="font-medium text-[#ce1126] hover:underline hover:text-[#a20e1f]">
        politique de confidentialité
      </Link>
      .
    </p>
  );
}
