"use client";

import React from 'react';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="oia-screen-layout oia-flex oia-justify-center oia-items-center">
        <div className="oia-spinner oia-spinner--lg"></div>
      </div>
    );
  }

  return (
    <div className="oia-screen-layout">
      <header className="oia-header">
        <Link href="/" className="oia-h2 oia-link-unstyled">
          {APP_NAME}
        </Link>
        <nav className="oia-nav">
          {user ? (
            <>
              <Link href="/dashboard" className="oia-nav__item">Dashboard</Link>
              <Link href="/builder" className="oia-nav__item">Builder</Link>
              <Link href="/themes" className="oia-nav__item">Themes</Link>
              <Link href="/brand" className="oia-nav__item">Brand Kit</Link>
              <Link href="/settings" className="oia-nav__item">Settings</Link>
              <button onClick={logout} className="oia-btn oia-btn-secondary oia-ml-lg">Log Out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="oia-nav__item">Log In</Link>
              <Link href="/signup" className="oia-nav__item">Sign Up</Link>
            </>
          )}
        </nav>
      </header>
      <main className="oia-main-content">
        {children}
      </main>
      <footer className="oia-footer oia-privacy-footer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>Your data stays on your device. No tracking. No ads.</span>
      </footer>
    </div>
  );
}
