import React from 'react';
import Topbar from './Topbar';

interface AppLayoutProps {
  children: React.ReactNode;
  activeRoute?: string;
}

export default function AppLayout({ children, activeRoute }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      <div className="scan-line fixed inset-0 pointer-events-none z-0 opacity-30" />
      <Topbar activeRoute={activeRoute} />
      <main className="pt-16 min-h-screen">{children}</main>
    </div>
  );
}