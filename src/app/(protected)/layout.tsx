'use client'

import dynamic from "next/dynamic";
import { Toaster } from "sonner"
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

const Sidebar = dynamic(
  () =>
    import("@/components/sidebar").then((mod) => {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/aec25d3d-f69f-4569-aa6b-763bde6b59a0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'post-fix',
          hypothesisId: 'H1',
          location: 'layout.tsx:24',
          message: 'Dynamic import resolved for Sidebar',
          data: {
            keys: Object.keys(mod ?? {}),
            hasDefault: !!mod?.default,
            hasNamedSidebar: !!(mod as any)?.Sidebar
          },
          timestamp: Date.now()
        })
      }).catch(() => {});
      // #endregion
      return (mod as any)?.default ?? (mod as any)?.Sidebar
    }),
  {
    ssr: false,
    loading: () => <div className="hidden md:block md:w-64" />
  }
)

const TopHeader = dynamic(
  () =>
    import("@/components/top-header").then((mod) => {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/aec25d3d-f69f-4569-aa6b-763bde6b59a0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'post-fix',
          hypothesisId: 'H2',
          location: 'layout.tsx:37',
          message: 'Dynamic import resolved for TopHeader',
          data: {
            keys: Object.keys(mod ?? {}),
            hasDefault: !!mod?.default,
            hasNamedTopHeader: !!(mod as any)?.TopHeader
          },
          timestamp: Date.now()
        })
      }).catch(() => {});
      // #endregion
      return (mod as any)?.default ?? (mod as any)?.TopHeader
    }),
  {
    ssr: false,
    loading: () => <div className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur" />
  }
)

const MobileNav = dynamic(
  () =>
    import("@/components/mobile-nav").then((mod) => {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/aec25d3d-f69f-4569-aa6b-763bde6b59a0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'post-fix',
          hypothesisId: 'H3',
          location: 'layout.tsx:50',
          message: 'Dynamic import resolved for MobileNav',
          data: {
            keys: Object.keys(mod ?? {}),
            hasDefault: !!mod?.default,
            hasNamedMobileNav: !!(mod as any)?.MobileNav
          },
          timestamp: Date.now()
        })
      }).catch(() => {});
      // #endregion
      return (mod as any)?.default ?? (mod as any)?.MobileNav
    }),
  {
    ssr: false
  }
)

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
                    <Toaster position="top-right" richColors closeButton duration={3000} />
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

