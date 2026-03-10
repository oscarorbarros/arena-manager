"use client";
import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Lock, Shield, Users, Briefcase } from "lucide-react";
import { UserRole } from "@/lib/types";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("public");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // For Delegate/Public
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(role, password, name)) {
        if (role === "admin" || role === "organization_member") router.push("/admin");
        else if (role === "referee") router.push("/referee");
        else if (role === "delegate") router.push("/delegate");
        else router.push("/public");
    } else {
        setError("Senha incorreta ou erro no login.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 font-sans">
      <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 w-full max-w-md shadow-2xl">
        <h1 className="text-xl md:text-2xl font-bold text-white mb-6 text-center">Acesso ao Sistema</h1>
        
        <form onSubmit={handleLogin} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Selecione seu perfil</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                        type="button"
                        onClick={() => setRole("public")}
                        className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${role === "public" ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-gray-900 border-gray-700 text-gray-500 hover:bg-gray-700"}`}
                    >
                        <Users className="w-5 h-5" />
                        <span className="text-[10px] uppercase font-bold">Público</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole("delegate")}
                        className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${role === "delegate" ? "bg-purple-600/20 border-purple-500 text-purple-400" :
                      role === "organization_member" ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500" : "bg-gray-900 border-gray-700 text-gray-500 hover:bg-gray-700"}`}
                    >
                        <Briefcase className="w-5 h-5" />
                        <span className="text-[10px] uppercase font-bold">Delegação</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole("referee")}
                        className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${role === "referee" ? "bg-red-600/20 border-red-500 text-red-400" : "bg-gray-900 border-gray-700 text-gray-500 hover:bg-gray-700"}`}
                    >
                        <Shield className="w-5 h-5" />
                        <span className="text-[10px] uppercase font-bold">Árbitro</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole("admin")}
                        className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${role === "admin" ? "bg-yellow-600/20 border-yellow-500 text-yellow-400" : "bg-gray-900 border-gray-700 text-gray-500 hover:bg-gray-700"}`}
                    >
                        <Lock className="w-5 h-5" />
                        <span className="text-[10px] uppercase font-bold">Admin</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole("organization_member")}
                        className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${role === "organization_member" ? "bg-cyan-600/20 border-cyan-500 text-cyan-400" : "bg-gray-900 border-gray-700 text-gray-500 hover:bg-gray-700"}`}
                    >
                        <Shield className="w-5 h-5" />
                        <span className="text-[10px] uppercase font-bold">Staff</span>
                    </button>
                </div>
            </div>

            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                {role === "admin" && (
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Senha de Admin</label>
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                            placeholder="Senha (123456)"
                        />
                    </div>
                )}

                { (role === "delegate" || role === "organization_member") && (
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">{role === "delegate" ? "Nome do Responsável" : "Seu Nome Completo"}</label>
                        <input 
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            placeholder="Seu nome completo"
                            required
                        />
                    </div>
                )}
            </div>

            {error && <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/50">{error}</p>}

            <button 
                type="submit"
                className={`w-full py-3 font-bold rounded-lg shadow-lg active:scale-95 transition-all text-white
                    ${role === "admin" ? "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500" : 
                      role === "referee" ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500" :
                      role === "delegate" ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500" :
                      role === "organization_member" ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500" :
                      "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                    }`}
            >
                {role === "public" ? "Acessar Portal" : "Entrar no Painel"}
            </button>
        </form>
      </div>
    </div>
  );
}
