"use client";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Trophy, LogOut, ChevronLeft, Menu, X, RefreshCw } from "lucide-react";
import { useState } from "react";
import { BTProvider, useBT } from "@/lib/bt-context";

function SyncButton() {
  const { config } = useBT();
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');

  const sync = async () => {
    setSyncing(true);
    try {
      const r = await fetch('/api/beach-tennis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      setStatus(r.ok ? 'ok' : 'err');
    } catch {
      setStatus('err');
    } finally {
      setSyncing(false);
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <button
      onClick={sync}
      disabled={syncing}
      title="Sincronizar dados com a nuvem"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
        status === 'ok' ? 'bg-green-500/20 border-green-500/40 text-green-400' :
        status === 'err' ? 'bg-red-500/20 border-red-500/40 text-red-400' :
        'bg-orange-500/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20'
      }`}
    >
      <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
      {status === 'ok' ? 'Sincronizado!' : status === 'err' ? 'Erro' : 'Sincronizar'}
    </button>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user || !["admin", "organization_member", "journalist"].includes(user.role as string)) {
    router.replace("/login");
    return null;
  }

  const links = [
    { href: "/beach-tennis", icon: LayoutDashboard, label: "Visão Geral" },
    { href: "/beach-tennis/teams", icon: Users, label: "Duplas / Times" },
    { href: "/beach-tennis/matches", icon: Trophy, label: "Partidas" },
  ];

  const NavLinks = () => (
    <>
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            pathname === link.href
              ? "bg-orange-500 text-white shadow-lg shadow-orange-900/30"
              : "text-white/60 hover:bg-orange-900/30 hover:text-white"
          }`}
        >
          <link.icon className="w-5 h-5" />
          <span className="font-medium">{link.label}</span>
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-amber-50/20 text-gray-900 flex flex-col md:flex-row">
      {/* Mobile header */}
      <div className="md:hidden bg-orange-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="font-black text-lg">🎾 Beach Tennis</h1>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 hover:bg-orange-800 rounded-lg">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-64 bg-orange-900 text-white flex-col shadow-xl">
        <div className="p-6 border-b border-orange-800/50">
          <h1 className="text-2xl font-black bg-gradient-to-r from-orange-300 to-amber-200 bg-clip-text text-transparent">
            🎾 Beach Tennis
          </h1>
          <p className="text-xs text-orange-300/70 mt-1">CBBT — Gestão de Torneio</p>
          <div className="mt-4 pt-4 border-t border-orange-800/50 space-y-2">
            <p className="text-orange-400/60 text-[10px] uppercase font-bold">Logado como</p>
            <p className="font-black text-white truncate">{user.name}</p>
            <div className="flex gap-2">
              <SyncButton />
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLinks />
        </nav>

        <div className="p-4 border-t border-orange-800/50 space-y-2">
          <Link href="/hub" className="flex items-center gap-2 text-orange-300/70 hover:text-white text-sm transition-colors">
            <ChevronLeft className="w-4 h-4" /> Voltar aos Módulos
          </Link>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-300 rounded-lg border border-red-500/20 hover:bg-red-500/20 text-xs font-bold">
            <LogOut className="w-3 h-3" /> SAIR
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)}>
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-orange-900 text-white flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-orange-800/50">
              <h1 className="text-xl font-black text-orange-300">🎾 Beach Tennis</h1>
            </div>
            <nav className="flex-1 p-4 space-y-1"><NavLinks /></nav>
            <div className="p-4 border-t border-orange-800/50">
              <Link href="/hub" className="block text-orange-300/70 text-sm mb-2">← Módulos</Link>
              <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-400/10 text-red-300 rounded-lg text-xs font-bold">
                <LogOut className="w-3 h-3" /> SAIR
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-auto bg-white p-4 md:p-8">{children}</main>
    </div>
  );
}

export default function BeachTennisLayout({ children }: { children: React.ReactNode }) {
  return (
    <BTProvider>
      <LayoutContent>{children}</LayoutContent>
    </BTProvider>
  );
}
