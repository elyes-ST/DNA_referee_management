'use client';
import "../globals.css";
import Image from "next/image";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <div className="min-h-screen w-full flex bg-white dark:bg-flashscore-card">
        {/* Left Side - Hero Section */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
            {/* 1. Background Image (Z-0) */}
             <div className="absolute inset-0 z-0 bg-black ">
                <Image 
                    src="/referee.png" 
                    alt="Referee" 
                    fill
                    className="object-cover "
                    priority
                />
            </div>

            {/* 2. Red Blurred Overlay Frame (Z-10) */}
            <div className="absolute inset-0 z-10 flex flex-col pointer-events-none bg-[#ce1126]/35 backdrop-blur-[0.5px] ">
                {/* Optional: Add a subtle gradient to make it richer */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#ce1126]/50 to-[#9b0d1c]/50 mix-blend-multiply" />
            </div>

            {/* Optional: Add a subtle overall gradient overlay on the image itself if needed */}
             <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#ce1126]/20 to-transparent mix-blend-overlay" />
        </div>
        
        {/* Right Side - Form Section */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:p-24 bg-white dark:bg-flashscore-card overflow-y-auto">
          <div className="w-full max-w-[450px] space-y-6">
            {children}
          </div>
        </main>
      </div>
  );
}
