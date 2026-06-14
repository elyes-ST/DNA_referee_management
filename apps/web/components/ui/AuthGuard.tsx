"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../hooks/useUser";
import { Role } from "../../types/user";

interface GuardProps {
  children: ReactNode;
  role?: Role | Role[];
}

export function AuthGuard({ children, role  }: GuardProps) {
  const { user, isAuthenticated, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // NOT AUTHENTICATED
    if (!isAuthenticated) {
        router.replace("/auth/signin");
      return;
    }

    // ROLE GUARDS - support both single role and array of roles
    if (role) {
      const allowedRoles = Array.isArray(role) ? role : [role];
      if (!user?.role || !allowedRoles.includes(user.role)) {
        router.replace("/");
        return;
      }
    }
    
  }, [loading, isAuthenticated, user, role, router]);

  // Block UI until user passes guard
  if (loading) return null;
  if (!isAuthenticated) return null;
  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!user?.role || !allowedRoles.includes(user.role)) return null;
  }

  return <>{children}</>;
}