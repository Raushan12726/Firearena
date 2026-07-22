'use client';
import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { Shield, Plus, Users, Wallet, Trophy } from 'lucide-react';
// Centralized Supabase client import karein
import { supabase } from '@/lib/supabaseClient';
import CreateMatchTab from './CreateMatchTab';
import ManagePlayersTab from './ManagePlayersTab';
import WalletApprovalsTab from './WalletApprovalsTab';
import DeclareResultsTab from './DeclareResultsTab';

type AdminTab = 'create' | 'players' | 'wallet' | 'results';

export default function AdminPanelContent() {
  const [activeTab, setActiveTab] = useState<AdminTab>('create');
  const [adminBalance, setAdminBalance] = useState<number>(0);
  
  // Dynamic Badge Counts
  const [playersCount, setPlayersCount] = useState<number>(0);
  const [walletCount, setWalletCount] = useState<number>(0);
  const [pendingResultsCount, setPendingResultsCount] = useState<number>(0);

  // Database se dynamic data fetch karne ka function
  const fetchDashboardCounts = async () => {
    try {
      // 1. Fetch Total Players Count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (userCount !== null) setPlayersCount(userCount);

      // 2. Fetch Pending Wallet Approvals Count
      const { count: withdrawalCount } = await supabase
        .from('withdrawal_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (withdrawalCount !== null) setWalletCount(withdrawalCount);

      // 3. Fetch Pending Match Results Count
      const { count: matchCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'Completed');
      if (matchCount !== null) setPendingResultsCount(matchCount);

      // 4. Fetch Admin Balance
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single();

        if (profile) {
          setAdminBalance(profile.balance || 0);
        }
      }
    } catch (err) {
      console.error('Data fetch error:', err);
    }
  };

  useEffect(() => {
    fetchDashboardCounts();
  }, []);

  // Dynamic Tabs Data
  const TABS: { id: AdminTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'create', label: 'Create Match', icon: Plus },
    { id: 'players', label: 'Players', icon: Users, badge: playersCount },
    { id: 'wallet', label: 'Wallet Approvals', icon: Wallet, badge: walletCount },
    { id: 'results', label: 'Declare Results', icon: Trophy, badge: pendingResultsCount },
  ];

  return (
    <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-6">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          },
        }}
      />

      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-neon-orange/15 border border-neon-orange/30 flex items-center justify-center">
          <Shield size={20} className="text-neon-orange" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground tracking-wider">
            ADMIN <span className="text-gradient-fire">CONTROL</span>
          </h1>
          <p className="text-sm text-muted-foreground">FireArena Tournament Management • admin@firearena.gg</p>
        </div>
        
        {/* Right Side: Wallet Balance + Admin Online Status */}
        <div className="ml-auto flex items-center gap-4">
          <div className="bg-muted/40 border border-border px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
            <span className="text-sm">👛</span>
            <span className="font-display font-bold text-sm text-foreground tracking-wider">
              ₹{adminBalance.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-neon-orange/10 border border-neon-orange/30 rounded-lg px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-neon-orange pulse-dot" />
            <span className="text-xs font-semibold text-neon-orange font-display tracking-wider">ADMIN ONLINE</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 mb-6 bg-muted/30 rounded-xl p-1 border border-border">
        {TABS.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={`admin-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-display font-semibold tracking-wider transition-all duration-200 flex-1 justify-center ${
                isActive
                  ? 'bg-card text-neon-orange border border-neon-orange/30 shadow-[0_0_12px_rgba(255,107,0,0.15)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <IconComponent size={15} className={isActive ? 'text-neon-orange' : ''} />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[20px] text-center ${
                  isActive ? 'bg-neon-orange/20 text-neon-orange' : 'bg-muted text-muted-foreground'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-slide-up">
        {activeTab === 'create' && <CreateMatchTab />}
        {activeTab === 'players' && <ManagePlayersTab />}
        {activeTab === 'wallet' && <WalletApprovalsTab />}
        {activeTab === 'results' && <DeclareResultsTab />}
      </div>
    </div>
  );
}