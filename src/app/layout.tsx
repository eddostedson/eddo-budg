import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/ultra-modern-toasts.css";
import "../styles/sticky-header.css";
import "../styles/sticky-page-header.css";
import { Sidebar } from "@/components/sidebar";
import { TopHeader } from "@/components/top-header";
import { MobileNav } from "@/components/mobile-nav";
import { ToastProvider } from "@/contexts/toast-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { UltraModernToastProvider } from "@/contexts/ultra-modern-toast-context";
import { RecetteProvider } from "@/contexts/recette-context";
import { DepenseProvider } from "@/contexts/depense-context";
import { TransactionProvider } from "@/contexts/transaction-context";
import { CategoryProvider } from "@/contexts/category-context";
import { TransfertProvider } from "@/contexts/transfer-context";
import { NotesProvider } from "@/contexts/notes-context";
import { BudgetProvider } from "@/contexts/budget-context";

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
        <ToastProvider>
          <NotificationProvider>
            <UltraModernToastProvider>
              <RecetteProvider>
                <DepenseProvider>
                  <BudgetProvider>
                    <TransactionProvider>
                      <CategoryProvider>
                        <TransfertProvider>
                          <NotesProvider>
                          <Sidebar />
                          <TopHeader />
                          <MobileNav />
                          <main className="ml-0 md:ml-16 pt-24 min-h-screen main-content">
                            <div className="p-4 md:p-6">
                              {children}
                            </div>
                          </main>
                          </NotesProvider>
                        </TransfertProvider>
                      </CategoryProvider>
                    </TransactionProvider>
                  </BudgetProvider>
                </DepenseProvider>
              </RecetteProvider>
            </UltraModernToastProvider>
          </NotificationProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
