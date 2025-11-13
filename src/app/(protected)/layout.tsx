'use client'

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
import { CompteBancaireProvider } from "@/contexts/compte-bancaire-context";
import { ReceiptProvider } from "@/contexts/receipt-context";
import "../../styles/ultra-modern-toasts.css";
import "../../styles/sticky-header.css";
import "../../styles/sticky-page-header.css";

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NotificationProvider>
      <UltraModernToastProvider>
        <RecetteProvider>
          <DepenseProvider>
            <CompteBancaireProvider>
              <ReceiptProvider>
                <TransactionProvider>
                  <CategoryProvider>
                    <TransfertProvider>
                      <NotesProvider>
                    <Sidebar />
                    <TopHeader />
                    <MobileNav />
                    <main className="ml-0 md:ml-64 pt-24 min-h-screen main-content">
                      <div className="p-4 md:p-6">
                        {children}
                      </div>
                    </main>
                      </NotesProvider>
                    </TransfertProvider>
                  </CategoryProvider>
                </TransactionProvider>
              </ReceiptProvider>
            </CompteBancaireProvider>
          </DepenseProvider>
        </RecetteProvider>
      </UltraModernToastProvider>
    </NotificationProvider>
  );
}

