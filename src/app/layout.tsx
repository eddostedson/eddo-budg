import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { TopHeader } from "@/components/top-header";
import { ToastProvider } from "@/contexts/toast-context";
import { BudgetProvider } from "@/contexts/budget-context";
import { TransactionProvider } from "@/contexts/transaction-context";
import { CategoryProvider } from "@/contexts/category-context";

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
          <BudgetProvider>
            <TransactionProvider>
              <CategoryProvider>
                <Sidebar />
                <TopHeader />
                <main className="ml-16 pt-16 min-h-screen main-content">
                  <div className="p-6">
                    {children}
                  </div>
                </main>
              </CategoryProvider>
            </TransactionProvider>
          </BudgetProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
