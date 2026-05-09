"use client";

import React, { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import AppLayout from '@/components/layout/AppLayout';
import AuthGuard from '@/components/AuthGuard';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppLayout>
          <AuthGuard>{children}</AuthGuard>
        </AppLayout>
      </AuthProvider>
    </ToastProvider>
  );
}
