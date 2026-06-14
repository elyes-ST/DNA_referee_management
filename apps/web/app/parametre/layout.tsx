'use client';
import "../globals.css";
import { useState, useEffect } from "react";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { usePathname } from 'next/navigation';
import { AuthGuard } from "../../components/ui/AuthGuard";
import { Role } from "../../types/user";
import { useUser } from "../../hooks/useUser";
import { getMenuItemsByRole } from "../../components/layout/MenuItems";

export default function ParametreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const pathname = usePathname();
    const { user } = useUser();
    
    const getPageTitle = () => "Paramètres";
    
    const [activePage, setActivePage] = useState('parametre');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Single source of truth — same full role menu as the admin layout, so the
    // sidebar keeps every authorized page when the user is on "Paramètres".
    const menuItems = getMenuItemsByRole(user?.role);

    // Update active page when pathname changes
    useEffect(() => {
        const segments = pathname.split('/');
        const page = segments[2] || segments[1] || 'parametre';
        setActivePage(page);
    }, [pathname]);

  return (
    <AuthGuard role={[
      Role.ADMIN_DNA, 
      Role.FINANCE_DNA, 
      Role.DESIGNATION_DNA, 
      Role.ARBITRE,
      Role.CRA,
      Role.CAA,
      Role.CAJ,
      Role.CAF,
      Role.CDC,
      Role.CDE,
      Role.INSPECTEUR
    ]}>
      <div className="min-h-screen bg-gray-50 dark:bg-flashscore-hover flex flex-row">
        
         <Sidebar 
        activePage={activePage} 
        onNavigate={setActivePage} 
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        menuItems={menuItems}
      />
      
      <div className={`
        flex-1 flex flex-col min-h-screen transition-all duration-300 min-w-0
        lg:ml-65 md:ml-55 ml-0 
      `}>
        <Header 
          title={getPageTitle()}
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
