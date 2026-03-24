"use client";

import React, { createContext, useContext, useCallback } from "react";
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";

export type UserRole = "buyer" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoggedIn: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthContextInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const user: User | null =
    session?.user && session.user.email
      ? {
          id: (session.user as { id?: string }).id ?? "",
          email: session.user.email,
          name: session.user.name ?? session.user.email.split("@")[0],
          role: ((session.user as { role?: string }).role as UserRole) ?? "buyer",
        }
      : null;

  const login = useCallback(async (email: string, password: string) => {
    const result = await signIn("credentials", {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });
    return !!(result?.ok && !result?.error);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.toLowerCase(), password, name }),
    });
    const data = await res.json();
    if (!data.ok) return false;
    return login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    signOut();
  }, []);

  const value: AuthContextValue = {
    user,
    login,
    register,
    logout,
    isLoggedIn: status === "authenticated" && !!user,
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextInner>{children}</AuthContextInner>
    </SessionProvider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
