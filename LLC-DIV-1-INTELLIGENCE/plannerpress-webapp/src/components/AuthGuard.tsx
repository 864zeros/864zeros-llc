"use client";

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
}

const publicPaths = ['/login', '/signup', '/'];

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      // If user is not logged in and trying to access a protected path
      if (!user && !publicPaths.includes(pathname)) {
        router.push('/login');
      }
      // If user is logged in and trying to access login/signup
      else if (user && (pathname === '/login' || pathname === '/signup')) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  // While loading, or if unauthenticated on a protected path, show nothing
  if (loading || (!user && !publicPaths.includes(pathname))) {
    return null;
  }

  return <>{children}</>;
}
