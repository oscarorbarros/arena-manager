"use client";
import { useAuth } from "@/lib/auth-context";
import { useTournament } from "@/lib/context";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Settings, Trophy, Users, LogOut, Shield, Newspaper, Menu, X, RefreshCw, Grid3x3 } from "lucide-react";
import { useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { config } = useTournament();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  
  const realUser = config.users?.find(u => u.id === user?.id) || user;
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle'|'ok'|'err'>('idle');

  const forcSync = async () => {
    setSyncing(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/config', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(config) }),
        fetch('/api/news', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(JSON.parse(localStorage.getItem('tournament_news') || '[]')) }),
      ]);
      setSyncStatus(r1.ok && r2.ok ? 'ok' : 'err');
    } catch { setSyncStatus('err'); }
    setSyncing(false);
    setTimeout(() => setSyncStatus('idle'), 4000);
  };

  // Delegates have their own panel — redirect them out of admin
  if (user?.role === "delegate") {
    router.replace("/delegate");
    return null;
  }

  if (!user || !["admin", "organization_member", "journalist"].includes(user.role as string)) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-xl border border-red-200 shadow-xl">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Acesso Restrito</h1>
          <p className="text-black mb-4">Seu nível de acesso não permite ver esta página.</p>
          <Link href="/login" className="px-6 py-2 bg-[#059669] hover:bg-[#065f46] text-white rounded-lg inline-block font-bold">
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  const links = [
    { href: "/admin", icon: LayoutDashboard, label: "Visão Geral" },
    { href: "/admin/config", icon: Settings, label: "Criar Torneio" },
    { href: "/admin/matches", icon: Trophy, label: "Partidas" },
    { href: "/admin/teams", icon: Users, label: "Times" },
    { href: "/admin/scorers", icon: Trophy, label: "Artilheiros" },
    { href: "/admin/users", icon: Shield, label: "Usuários" },
    { href: "/admin/news", icon: Newspaper, label: "Notícias" },
    { href: "/admin/logs", icon: Newspaper, label: "Logs" },
  ];

  const NavLinks = () => (
    <>
      {links.filter(link => {
          if (realUser?.role === "admin") return true;
          if (realUser?.role === "journalist") return ["/admin", "/admin/news"].includes(link.href);
          if (realUser?.role === "organization_member") return ["/admin", "/admin/matches", "/admin/teams", "/admin/scorers", "/admin/users"].includes(link.href);
          if (realUser?.role === "delegate") return ["/admin", "/admin/teams", "/admin/scorers"].includes(link.href);
          return false;
      }).map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${pathname === link.href
              ? "bg-[#059669] text-white shadow-lg shadow-emerald-900/20"
              : "text-white/70 hover:bg-emerald-800 hover:text-white"
            }`}
        >
          <link.icon className="w-5 h-5" />
          <span className="font-medium">{link.label}</span>
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-emerald-50 text-black flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-emerald-50/50 border-b border-white/10 p-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold text-white">O2R Sports</h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-white shadow-premium border border-emerald-200/60 rounded-lg"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 bg-emerald-900 text-white shadow-md border-r border-emerald-800/30 flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            O2R Sports
          </h1>
          <p className="text-xs text-white/70 mt-1">Painel Administrativo</p>
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-sm mb-2">
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Logado como:</p>
              <p className="font-black text-white text-lg truncate">{realUser?.name || "Admin"}</p>
            </div>
            <button onClick={() => logout()} className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-200 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-all text-[10px] font-bold">
              <LogOut className="w-3 h-3" /> SAIR
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavLinks />
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            onClick={forcSync}
            disabled={syncing}
            className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
              syncStatus === 'ok' ? 'bg-green-500/20 border-green-500/30 text-green-300' :
              syncStatus === 'err' ? 'bg-red-500/20 border-red-500/30 text-red-300' :
              'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            {syncStatus === 'ok' ? '✓ Sincronizado!' : syncStatus === 'err' ? '✗ Erro na sync' : 'Sincronizar Nuvem'}
          </button>
          <Link href="/hub" className="block text-center px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] text-white/60 font-bold transition-all flex items-center justify-center gap-1.5">
            <Grid3x3 className="w-3 h-3" /> Módulos
          </Link>
          <Link href="/" className="block text-center px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white font-bold transition-all">
            Ver Site
          </Link>
        </div>
      </aside>

      {/* Sidebar - Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileMenuOpen(false)}>
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 bg-emerald-900 text-white shadow-md border-r border-emerald-800/30 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/10">
              <h1 className="text-xl font-bold text-white">O2R Sports</h1>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              <NavLinks />
            </nav>

            <div className="p-4 border-t border-white/10">
              <div className="text-sm mb-3">
                <p className="text-white/60 text-xs">Logado como:</p>
                <p className="font-medium">{realUser?.name || "Admin"}</p>
              </div>
              <Link href="/" className="block text-center px-3 py-2 bg-white shadow-premium border border-emerald-200/60 rounded text-sm mb-2">
                Ver Site
              </Link>
              <button
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-400/10 text-red-200 rounded"
              >
                <LogOut className="w-4 h-4" />
                SAIR
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white p-4 md:p-8">{children}</main>
    </div>
  );
}
