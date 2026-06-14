"use client";

import { useUser } from "../../hooks/useUser";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export const GlobalLogoutButton = () => {
    const { logout, isAuthenticated } = useUser();
    const router = useRouter();

    if (!isAuthenticated) return null;

    const handleLogout = async () => {
        await logout();
        router.push('/auth/signin');
    }

    return (
        <button
            onClick={handleLogout}
            className="fixed bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg z-50 flex items-center justify-center transition-colors"
            title="Déconnexion"
        >
            <LogOut size={24} />
        </button>
    );
};
