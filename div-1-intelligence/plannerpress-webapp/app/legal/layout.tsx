"use client";

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import './styles.css'; // Custom styles for legal pages

interface LegalLayoutProps {
  children: ReactNode;
}

export default function LegalLayout({ children }: LegalLayoutProps) {
  return (
    <div className="oia-screen-layout">
      <header className="oia-header">
        <Link href="/dashboard" className="oia-h2 oia-link-unstyled">
          {APP_NAME}
        </Link>
      </header>
      <main className="oia-main-content legal-main-content">
        {children}
      </main>
      <footer className="oia-footer oia-options-footer">
        <div className="oia-options-footer__links">
          <Link href="/legal/terms" className="oia-link">Terms of Use</Link>
          <span className="oia-options-footer__divider">•</span>
          <Link href="/legal/privacy" className="oia-link">Privacy Policy</Link>
          <span className="oia-options-footer__divider">•</span>
          <a href="https://864zeros.com" target="_blank" rel="noopener noreferrer" className="oia-link">864zeros.com</a>
        </div>
        <div className="oia-options-footer__copyright">
          © {new Date().getFullYear()} 864zeros LLC. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
