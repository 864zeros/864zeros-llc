import type { Metadata } from "next";
import "@/styles/oia-design-system.css";
import "@/styles/app-layout.css";
import React from 'react';
import { Providers } from '@/app/providers';

export const metadata: Metadata = {
  title: "PlannerPress",
  description: "The Automated Etsy Digital Planner Studio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}


