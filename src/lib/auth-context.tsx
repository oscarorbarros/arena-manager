"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, UserRole, TournamentConfig } from "./types";

interface AuthContextType {
  user: User | null;
  login: (role: UserRole, password?: string, name?: string) => boolean;
  loginWithUser: (user: User) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    console.log('=== AUTH CONTEXT INIT ===');
    const savedUser = localStorage.getItem("arena_user");
    console.log('Saved user from localStorage:', savedUser);
    if (savedUser) {
        try {
            const parsedUser = JSON.parse(savedUser);
            console.log('Parsed user:', parsedUser);
            // Migration: referee -> organization_member
            if (parsedUser.role === "referee") {
                parsedUser.role = "organization_member";
                localStorage.setItem("arena_user", JSON.stringify(parsedUser));
            }
            setUser(parsedUser);
            console.log('User set successfully:', parsedUser);
        } catch (e) {
            console.error("Failed to parse user", e);
        }
    } else {
        console.log('No saved user found in localStorage');
    }
    console.log('========================');
  }, []);

  const login = (selectedRole: UserRole, password?: string, name?: string) => {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Selected Role:', selectedRole);
    console.log('Password provided:', password ? 'Yes' : 'No');
    console.log('Name provided:', name);
    if (selectedRole === "admin" || selectedRole === "journalist") {
        if (password === "123456") {
            const userName = selectedRole === "admin" ? "Admin" : "Jornalista";
            const adminUser: User = { id: selectedRole, name: userName, email: `${selectedRole}@arena.com`, role: selectedRole };
            console.log('Admin user created:', adminUser);
            setUser(adminUser);
            localStorage.setItem("arena_user", JSON.stringify(adminUser));
            return true;
        }
        return false;
    }
    
    if (selectedRole === "delegate") {
         const delegateUser: User = { 
             id: `del_${Date.now()}`, 
             name: name || "Chefe de Delegação", 
             email: `delegate_${Date.now()}@arena.com`,
             role: "delegate",
             teamId: "mock-team-id"
         };
         setUser(delegateUser);
         localStorage.setItem("arena_user", JSON.stringify(delegateUser));
         return true;
    }

    if (selectedRole === "president") {
         const presidentUser: User = { 
             id: `pres_${Date.now()}`, 
             name: name || "Presidente do Torneio", 
             email: `president_${Date.now()}@arena.com`,
             role: "president"
         };
         setUser(presidentUser);
         localStorage.setItem("arena_user", JSON.stringify(presidentUser));
         return true;
    }

    // Public & Organization Member
    const simpleUser: User = {
        id: crypto.randomUUID(),
        name: name || (selectedRole === "organization_member" ? "Membro da Organização" : "Visitante"),
        email: `${selectedRole}_${Date.now()}@arena.com`,
        role: selectedRole
    };
    
    setUser(simpleUser);
    localStorage.setItem("arena_user", JSON.stringify(simpleUser));
    return true;
  };

  const loginWithUser = (user: User) => {
    setUser(user);
    localStorage.setItem("arena_user", JSON.stringify(user));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("arena_user");
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Permission Helpers
export const canManageTeams = (user: User | null) => 
  user ? ['admin', 'organization_member'].includes(user.role as string) : false;

export const canConfigureTournament = (user: User | null, config: TournamentConfig) => {
  console.log('=== canConfigureTournament CHECK ===');
  console.log('User:', user);
  console.log('User Role:', user?.role);
  console.log('User ID:', user?.id);
  console.log('Config President ID:', config.presidentId);
  console.log('Config Status:', config.status);
  
  if (!user) {
    console.log('Result: FALSE (no user)');
    return false;
  }
  
  const isAdmin = user.role === 'admin';
  const isPresident = user.id === config.presidentId;
  const result = isAdmin || isPresident;
  
  console.log('Is Admin:', isAdmin);
  console.log('Is President:', isPresident);
  console.log('Result:', result);
  console.log('===================================');
  
  return result;
};





