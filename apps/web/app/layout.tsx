import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";

import { UserProvider } from "../hooks/useUser";


const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "DNA",
  description: "Plateforme de gestion des désignations sportives",
};

import { ThemeProvider } from "../components/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>

      <body className={`${geistSans.variable} ${geistMono.variable}`}>

        <UserProvider>
          <ThemeProvider attribute="class" defaultTheme="light">
            <Toaster richColors position="top-right" />
            {children}
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
