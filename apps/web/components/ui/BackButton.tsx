"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="border border-gray-300 dark:border-flashscore-border hover:bg-gray-50 dark:bg-flashscore-hover px-6 py-3 rounded-lg font-semibold"
    >
      Page précédente
    </button>
  );
}