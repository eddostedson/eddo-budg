import type { Metadata } from "next";
import "../../styles/ultra-modern-toasts.css";

export const metadata: Metadata = {
  title: "Connexion - Compta MVP",
  description: "Page de connexion à l'application",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {children}
    </div>
  );
}

