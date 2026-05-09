"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';

interface AuthContextType {
  user: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    // Simulate checking session on component mount
    const storedUser = localStorage.getItem('plannerpress_user');
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    // Mock API call: In a real app, this would hit a backend API
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    if (email === 'test@example.com' && password === 'password') {
      localStorage.setItem('plannerpress_user', email);
      setUser(email);
      router.push('/dashboard');
      setLoading(false);
      showToast('Logged in successfully!', 'success');
      return true;
    } else {
      showToast('Invalid credentials or user not found. Try test@example.com / password', 'error');
      setLoading(false);
      return false;
    }
  };

  const signup = async (email: string, password: string) => {
    setLoading(true);
    // Mock API call: In a real app, this would hit a backend API
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    if (email && password) {
      // For this mock, we just "sign up" the user immediately
      localStorage.setItem('plannerpress_user', email);
      setUser(email);
      router.push('/dashboard');
      setLoading(false);
      showToast('Account created successfully!', 'success');
      return true;
    } else {
      showToast('Please enter valid email and password.', 'error');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setLoading(true);
    localStorage.removeItem('plannerpress_user');
    setUser(null);
    router.push('/login');
    setLoading(false);
    showToast('Logged out.', 'info');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
