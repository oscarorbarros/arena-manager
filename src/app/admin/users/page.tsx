"use client";
import React, { useState } from "react";
import { useTournament } from "@/lib/context";
import { useAuth } from "@/lib/auth-context";
import { User, UserRole } from "@/lib/types";
import { useAudit } from "@/lib/audit-context";
import { Users, Plus, Trash2, Shield, User as UserIcon, ShieldAlert } from "lucide-react";

export default function AdminUsersPage() {
  const { config, setConfig } = useTournament();
  const { user: currentUser } = useAuth();
  const { logAction } = useAudit();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
      id: "",
      name: "",
      email: "",
      password: "",
      role: "delegate" as UserRole
  });

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name || !formData.email || !formData.password) return alert("Preencha todos os campos!");
      
      if (isEditing) {
          if (formData.id === "admin" && formData.role !== "admin") {
              return alert("O usuário administrador principal não pode ter sua função alterada.");
          }
          setConfig(prev => ({
              ...prev,
              users: prev.users.map(u => u.id === formData.id ? { ...u, 
                  name: formData.name, 
                  email: formData.email, 
                  password: formData.password, 
                  role: formData.role 
              } : u)
          }));
          logAction("edit_user", `Editou o usuário ${formData.email} (Nova Função: ${formData.role})`);
          alert("Usuário atualizado!");
      } else {
          const newUser: User = {
              id: crypto.randomUUID(),
              name: formData.name,
              email: formData.email,
              password: formData.password,
              role: formData.role
          };
          setConfig(prev => ({
              ...prev,
              users: [...(prev.users || []), newUser]
          }));
          logAction("create_user", `Criou o usuário ${formData.email} (Função: ${formData.role})`);
          alert("Usuário criado com sucesso!");
      }
      closeModal();
  };

  const handleEdit = (user: User) => {
      setFormData({
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password || "",
          role: user.role
      });
      setIsEditing(true);
      setIsModalOpen(true);
  };


const handleDelete = (userId: string) => {
      const userToRemove = config.users?.find(u => u.id === userId);
      if (!userToRemove) return;
      
      if (userId === currentUser?.id) {
          return alert("Você não pode excluir a sua própria conta!");
      }

      if (userToRemove.role === "admin" && currentUser?.role !== "admin") {
          return alert("Apenas outros administradores podem excluir uma conta de Administrador.");
      }

      if (userId === "admin") {
          return alert("O usuário administrador principal não pode ser removido!");
      }
      if (confirm("Tem certeza que deseja remover este usuário?")) {
          setConfig(prev => ({
              ...prev,
              users: prev.users.filter(u => u.id !== userId)
          }));
          logAction("delete_user", `Removeu o usuário: ${userToRemove.email}`);
      }
  };


  const handleClearUsers = () => {
    if (confirm("Deseja excluir TODOS os usuários delegados?")) {
        setConfig(prev => ({
            ...prev,
            users: (prev.users || []).filter(u => u.role !== "delegate")
        }));
        logAction("clear_users", `Removeu todos os usuários delegados em massa.`);
        alert("Usuários delegados removidos.");
    }
  };

  const closeModal = () => {
      setIsModalOpen(false);
      setIsEditing(false);
      setFormData({ id: "", name: "", email: "", password: "", role: "delegate" });
  };

  const getRoleBadge = (role: UserRole) => {
      switch(role) {
          case "admin": return <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-400/30">ADMIN</span>;
          case "organization_member": return <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-amber-600 text-xs font-bold border border-yellow-500/30">STAFF / JUIZ</span>;
          case "delegate": return <span className="px-2 py-0.5 rounded bg-[#059669] text-white/20 text-white text-xs font-bold border border-emerald-300/30">DELEGADO</span>;
          case "president": return <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">PRESIDENTE</span>;
          default: return <span className="px-2 py-0.5 rounded bg-emerald-200/50 text-black text-xs">PÚBLICO</span>;
      }
  };

  return (
    <div className="text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Users className="text-emerald-700" />
            Gestão de Usuários
        </h1>
        <div className="flex gap-2">
            <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#047857] hover:bg-emerald-800 text-white rounded-lg font-bold transition-colors shadow-lg shadow-emerald-900/10"
        >
            <Plus className="w-4 h-4" />
            Novo Usuário
        </button>
        <button 
            onClick={handleClearUsers}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold transition-colors shadow-lg ml-2"
        >
            <Users className="w-4 h-4" />
            Excluir todos usuários
            </button>
        </div>
      </div>

      <div className="bg-emerald-50/60 shadow-premium border border-emerald-200/60 rounded-xl border border-emerald-200/60 overflow-x-auto">
        <table className="w-full text-left">
            <thead className="bg-emerald-50/50 text-black text-xs uppercase font-bold">
                <tr>
                    <th className="p-4">Nome</th>
                    <th className="p-4">Email / Login</th>
                    <th className="p-4">Função</th>
                    <th className="p-4 text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100">
                {(config.users || []).map(sysUser => (
                    <tr key={sysUser.id} className="hover:bg-emerald-200/40 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-200/50 flex items-center justify-center">
                                <UserIcon className="w-4 h-4 text-black" />
                            </div>
                            <span className="font-medium">{sysUser.name}</span>
                        </td>
                        <td className="p-4 text-black font-mono text-sm">{sysUser.email}</td>
                        <td className="p-4">{getRoleBadge(sysUser.role)}</td>
                        <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={() => handleEdit(sysUser)}
                                        className="p-2 text-black hover:text-black hover:bg-emerald-100/300/10 rounded-lg transition-colors"
                                        title="Editar Usuário / Trocar Senha"
                                    >
                                        <Users className="w-4 h-4" />
                                    </button>
                                    {sysUser.id !== currentUser?.id && (currentUser?.role === "admin" || sysUser.role !== "admin") && (
                                        <button 
                                            onClick={() => handleDelete(sysUser.id)}
                                            className="p-2 text-black hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Remover Usuário"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                        </td>
                    </tr>
                ))}
                {(config.users || []).length === 0 && (
                    <tr>
                        <td colSpan={4} className="p-8 text-center text-black">
                            Nenhum usuário encontrado. Adicione o primeiro!
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-emerald-50/60 shadow-premium border border-emerald-200/60 rounded-xl w-full max-w-md border border-emerald-200/60 animate-in zoom-in-95">
                  <div className="p-6 border-b border-emerald-200/60">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                          <Plus className="text-emerald-700" /> {isEditing ? "Editar Usuário" : "Novo Usuário"}
                      </h3>
                  </div>
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-black mb-1">Nome Completo</label>
                          <input 
                            type="text" 
                            className="w-full bg-emerald-50/50 border border-emerald-200 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none text-black"
                            placeholder="Ex: João da Silva"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-black mb-1">Email (Login)</label>
                          <input 
                            type="email" 
                            className="w-full bg-emerald-50/50 border border-emerald-200 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none text-black"
                            placeholder="Ex: joao@arena.com"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                          />
                      </div>
                       <div>
                          <label className="block text-sm font-medium text-black mb-1">Senha Temporária</label>
                          <input 
                            type="text" 
                            className="w-full bg-emerald-50/50 border border-emerald-200 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none text-black font-mono"
                            placeholder="Ex: 123456"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-black mb-1">Função</label>
                          <select 
                            className="w-full bg-emerald-50/50 border border-emerald-200 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none text-black"
                            value={formData.role || "delegate"}
                            onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                          >
                              {currentUser?.role === "admin" && <option value="admin">Administrador (Acesso Total)</option>}
                              <option value="organization_member">Membro da Equipe (Juiz/Staff)</option>
                              <option value="delegate">Chefe de Delegação (Times)</option>
                              <option value="president">Presidente do Torneio</option>
                          </select>
                      </div>

                      <div className="flex gap-3 pt-4">
                          <button type="button" onClick={closeModal} className="flex-1 py-3 bg-emerald-200/50 hover:bg-gray-600 rounded-lg font-bold transition-colors">Cancelar</button>
        
                          <button type="submit" className="flex-1 py-3 bg-[#047857] hover:bg-emerald-800 text-white rounded-lg font-bold transition-colors shadow-lg">{isEditing ? "Atualizar" : "Criar Usuário"}</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
