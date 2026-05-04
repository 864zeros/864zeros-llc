import React from 'react';
import { BuilderProvider } from '@/context/BuilderContext';

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BuilderProvider>
      <section>
        {/* You can add builder-specific layout elements here if needed in the future */}
        {children}
      </section>
    </BuilderProvider>
  );
}
