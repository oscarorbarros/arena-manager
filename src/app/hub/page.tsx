"use client";
import React from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import Link from "next/link";

const modules = [
  {
    id: "futebol",
    name: "Futebol",
    emoji: "⚽",
    href: "/admin",
    status: "active" as const,
    gradient: "from-emerald-600 to-green-700",
    shadow: "shadow-emerald-900/40",
    description: "Campeonatos de Futebol e Futsal",
    tags: ["Grupos", "Eliminatórias", "Pênaltis"],
  },
  {
    id: "beach-tennis",
    name: "Beach Tennis",
    emoji: "🎾",
    href: "/beach-tennis",
    status: "active" as const,
    gradient: "from-orange-500 to-amber-600",
    shadow: "shadow-orange-900/40",
    description: "Duplas masculino, feminino e misto",
    tags: ["CBBT", "Sets", "Tie-break"],
  },
  {
    id: "volei",
    name: "Vôlei",
    emoji: "🏐",
    href: "#",
    status: "soon" as const,
    gradient: "from-blue-600 to-indigo-700",
    shadow: "shadow-blue-900/40",
    description: "Em breve",
    tags: [],
  },
  {
    id: "basquete",
    name: "Basquete",
    emoji: "🏀",
    href: "#",
    status: "soon" as const,
    gradient: "from-orange-600 to-red-700",
    shadow: "shadow-red-900/40",
    description: "Em breve",
    tags: [],
  },
  {
    id: "tenis-mesa",
    name: "Tênis de Mesa",
    emoji: "🏓",
    href: "#",
    status: "soon" as const,
    gradient: "from-purple-600 to-violet-700",
    shadow: "shadow-purple-900/40",
    description: "Em breve",
    tags: [],
  },
  {
    id: "egame",
    name: "E-Game",
    emoji: "🎮",
    href: "#",
    status: "soon" as const,
    gradient: "from-cyan-600 to-blue-700",
    shadow: "shadow-cyan-900/40",
    description: "Em breve",
    tags: [],
  },
];

export default function HubPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    router.replace("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              🏟️ Arena Manager
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Central de Módulos Esportivos</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden md:block">
              Olá, <strong className="text-white">{user.name}</strong>
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all text-xs font-bold"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Selecione o Módulo
          </h2>
          <p className="text-gray-500 text-lg">Escolha o esporte que deseja gerenciar</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(mod => (
            mod.status === 'active' ? (
              <Link key={mod.id} href={mod.href}>
                <div className={`group relative rounded-3xl bg-gradient-to-br ${mod.gradient} p-0.5 shadow-xl ${mod.shadow} hover:scale-[1.03] transition-all duration-300 cursor-pointer`}>
                  <div className="bg-gray-900 rounded-[22px] p-8 h-full hover:bg-gray-850 transition-colors">
                    <div className="text-6xl mb-5 group-hover:scale-110 transition-transform duration-200">{mod.emoji}</div>
                    <h3 className="text-2xl font-black mb-2 text-white">{mod.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{mod.description}</p>
                    {mod.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {mod.tags.map(tag => (
                          <span key={tag} className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-gray-300">{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className={`mt-6 flex items-center gap-2 text-sm font-bold bg-gradient-to-r ${mod.gradient} bg-clip-text text-transparent`}>
                      Acessar módulo →
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div key={mod.id} className="relative rounded-3xl bg-gray-800/40 border border-gray-800 p-8 opacity-50 cursor-not-allowed">
                <div className="absolute top-4 right-4 text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full font-bold">Em breve</div>
                <div className="text-6xl mb-5 grayscale">{mod.emoji}</div>
                <h3 className="text-2xl font-black mb-2 text-gray-400">{mod.name}</h3>
                <p className="text-gray-600 text-sm">{mod.description}</p>
              </div>
            )
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-16 text-center">
          <p className="text-gray-700 text-sm">
            Arena Manager • Sistema de Gestão de Torneios Esportivos
          </p>
        </div>
      </main>
    </div>
  );
}
