"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface UserWallet {
  paidBalance: number;
  freeBalance: number;
  totalBalance?: number;
  freeCoinsExpiry?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  penName?: string;
  avatar?: string;
  role: "GUEST" | "READER" | "AUTHOR" | "MODERATOR" | "FINANCE_ADMIN" | "SUPER_ADMIN";
  status: string;
  ageVerified: boolean;
  wallet?: UserWallet;
  authorProfile?: {
    bio?: string;
    totalEarnings?: number;
    pendingPayout?: number;
    kycStatus?: string;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: { email: string; password: string; name: string; penName?: string; role?: string; birthdate?: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  switchDemoRole: (role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/v1/auth/me");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.user) {
          setUser(json.data.user);
          return;
        }
      }
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const json = await res.json();
      if (json.success && json.data?.user) {
        setUser(json.data.user);
        return { success: true };
      }
      return { success: false, message: json.error?.message || "เข้าสู่ระบบไม่สำเร็จ" };
    } catch {
      return { success: false, message: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" };
    }
  };

  const register = async (data: { email: string; password: string; name: string; penName?: string; role?: string; birthdate?: string }) => {
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success && json.data?.user) {
        setUser(json.data.user);
        return { success: true };
      }
      return { success: false, message: json.error?.message || "ลงทะเบียนไม่สำเร็จ" };
    } catch {
      return { success: false, message: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  };

  // Demo Switcher helper: instantly logs in as reader, author, finance, moderator, or admin
  const switchDemoRole = async (targetRole: string) => {
    setLoading(true);
    let targetEmail = "reader@novel.com";
    if (targetRole === "AUTHOR") targetEmail = "author1@novel.com";
    if (targetRole === "MODERATOR") targetEmail = "moderator@novel.com";
    if (targetRole === "FINANCE_ADMIN") targetEmail = "finance@novel.com";
    if (targetRole === "SUPER_ADMIN") targetEmail = "admin@novel.com";
    if (targetRole === "GUEST") {
      await logout();
      setLoading(false);
      return;
    }

    await login(targetEmail, "password123");
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
