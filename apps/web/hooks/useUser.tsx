"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode
} from "react";
import { User } from "../types/user";
import { api } from "../services/api";
import { toast } from "sonner";

interface UserContextType {
  user: User | null;
  setUser: (u: User | null) => void;
  login: (user: User , token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const u = localStorage.getItem("user");
    const t = localStorage.getItem("access_token");

    if (u) setUser(JSON.parse(u));
    if (t) setAccessToken(t);

    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout();
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setAccessToken(null);
    setUser(null);
  }, []);

  const fetchUser = useCallback(async () => {
    const stored = localStorage.getItem("user");
    if (!stored) return;

    const parsed = JSON.parse(stored);

    try {
        const res = await api.users.getMyProfile();
        setUser(res.data);
    } catch (err: any) {
      logout();
    }
  }, [logout]);
  useEffect(() => {
    fetchUser();
  }, []);


  const login = useCallback((userData: User, token: string) => {
    if (!userData || !token){
      toast.error("Invalid user data or token"); 
      return;
    }
    localStorage.setItem("access_token", token);
    localStorage.setItem(
      "user",
    JSON.stringify(userData)
        
    );

    setAccessToken(token);
    setUser(userData);
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const isAuthenticated = !!user && !!accessToken;

  const value = useMemo(
    () => ({
      user,
      setUser,
      login,
      logout,
      isAuthenticated,
      loading,
      refreshUser
    }),
    [user, isAuthenticated, loading, login, logout, refreshUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be inside UserProvider");
  return ctx;
}