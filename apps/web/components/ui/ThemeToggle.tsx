"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[32px] h-[32px]" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="text-gray-500 dark:text-gray-400 dark:text-flashscore-muted hover:bg-gray-50 dark:bg-flashscore-hover hover:text-[#ce1126] dark:text-gray-400 dark:text-flashscore-muted dark:hover:bg-flashscore-hover dark:hover:text-[#ce1126] p-1.5 rounded-md transition-all text-lg flex items-center justify-center"
      title="Basculer le thème"
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      <span className="sr-only">Basculer le thème</span>
    </button>
  );
}
