'use client';
import "../globals.css";
import { useState, useEffect } from "react";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { usePathname } from 'next/navigation';
import { AuthGuard } from "../../components/ui/AuthGuard";
import { Role } from "../../types/user";
import { arbitreMenuItems } from "../../components/layout/MenuItems";
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const pathname = usePathname();
    const getPageTitle = (page : string) => {
    const titles: Record<string, string> = {
        dashboard: "Tableau de Bord",
        matches: "Mes Matchs",
        formations: "Formations",
        ressources: "Ressources Pédagogiques",
        paiements: "Mes Paiements",
        profile: "Mon Profil",
        availability: "Ma Disponibilité",
        parametre: "Paramètres",
    };
    return titles[page] || "Dashboard";
  };
    const [activePage, setActivePage] = useState(pathname.split('/')[2] || 'dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Update active page when pathname changes
    useEffect(() => {
        const page = pathname.split('/')[2] || 'dashboard';
        setActivePage(page);
    }, [pathname]);
  return (
    <AuthGuard role={Role.ARBITRE}>
      <div className="min-h-screen bg-gray-50 dark:bg-flashscore-hover flex flex-row">
        
         <Sidebar 
        activePage={activePage} 
        onNavigate={setActivePage} 
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        menuItems={arbitreMenuItems}
      />
      
      <div className={`
        flex-1 flex flex-col min-h-screen transition-all duration-300 min-w-0
        lg:ml-65 md:ml-55 ml-0 
      `}>
        <Header 
          title={getPageTitle(activePage)}
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 ">
          {children}
        </main>
      </div>
      </div>
    </AuthGuard>
  );
}
