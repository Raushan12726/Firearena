'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { Swords, Shield, Wallet, Menu, X, Bell, ChevronDown, LogOut, User } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface TopbarProps {
  activeRoute?: string;
}

const navItems = [
  { label: 'Matches', href: '/match-dashboard', icon: Swords },
  { label: 'Admin', href: '/admin-panel', icon: Shield },
];

export default function Topbar({ activeRoute }: TopbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-card border-b border-border backdrop-blur-sm">
      <div className="flex items-center justify-between h-full px-4 lg:px-8 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <AppLogo size={36} />
          <span className="font-display text-xl font-bold tracking-widest neon-text-cyan hidden sm:block">
            FIRE<span className="text-neon-orange">ARENA</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.href;
            return (
              <Link
                key={`nav-${item.href}`}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-display font-semibold tracking-wider transition-all duration-200 ${
                  isActive
                    ? 'text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/30' :'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Wallet Badge */}
          <div className="hidden sm:flex items-center gap-2 bg-neon-orange/10 border border-neon-orange/30 rounded px-3 py-1.5">
            <Wallet size={14} className="text-neon-orange" />
            <span className="font-display font-bold text-sm text-neon-orange">₹1,250</span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-neon-orange" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 rounded bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 border border-neon-cyan/40 flex items-center justify-center text-xs font-bold font-display text-neon-cyan">
                RK
              </div>
              <ChevronDown size={14} className="text-muted-foreground hidden sm:block" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 card-surface rounded-lg shadow-xl z-50 overflow-hidden animate-fade-scale">
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground">RocketKing_FF</p>
                  <p className="text-xs text-muted-foreground">UID: 4892736105</p>
                </div>
                <Link href="/" className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-white/5 transition-colors">
                  <User size={14} className="text-neon-cyan" />
                  Profile
                </Link>
                <button className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          <button
            className="md:hidden p-2 rounded hover:bg-white/5 transition-colors text-muted-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-card border-b border-border p-4 space-y-1 animate-slide-up">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.href;
            return (
              <Link
                key={`mobile-nav-${item.href}`}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded font-display font-semibold tracking-wider text-sm transition-all ${
                  isActive ? 'text-neon-cyan bg-neon-cyan/10' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
          <div className="flex items-center gap-2 px-4 py-3 bg-neon-orange/10 border border-neon-orange/30 rounded mt-2">
            <Wallet size={16} className="text-neon-orange" />
            <span className="font-display font-bold text-neon-orange">₹1,250</span>
            <span className="text-xs text-muted-foreground ml-1">Wallet Balance</span>
          </div>
        </div>
      )}
    </header>
  );
}