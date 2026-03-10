import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TournamentProvider } from "@/lib/context";
import { AuthProvider } from "@/lib/auth-context";
import { AuditProvider } from "@/lib/audit-context";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "O2R Sports Manager",
  description: "Gerenciador de Torneios Esportivos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={cn(inter.className, "bg-gray-50 min-h-screen text-gray-900")}>
        <AuthProvider>
            <AuditProvider>
                <TournamentProvider>
                    {children}
                </TournamentProvider>
            </AuditProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
