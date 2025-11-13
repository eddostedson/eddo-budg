import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/ultra-modern-toasts.css";
import "../styles/sticky-header.css";
import "../styles/sticky-page-header.css";
import { Sidebar } from "@/components/sidebar";
import { TopHeader } from "@/components/top-header";
import { MobileNav } from "@/components/mobile-nav";
import { NotificationProvider } from "@/contexts/notification-context";
import { UltraModernToastProvider } from "@/contexts/ultra-modern-toast-context";
import { TransactionProvider } from "@/contexts/transaction-context";
import { CategoryProvider } from "@/contexts/category-context";
import { TransfertProvider } from "@/contexts/transfer-context";
import { NotesProvider } from "@/contexts/notes-context";
import { RecetteProvider } from "@/contexts/recette-context-direct";
import { DepenseProvider } from "@/contexts/depense-context-direct";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Compta MVP",
  description: "Application de gestion budgétaire",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-gray-900 min-h-screen main-content`}
      >
        {children}
      </body>
    </html>
  );
}
