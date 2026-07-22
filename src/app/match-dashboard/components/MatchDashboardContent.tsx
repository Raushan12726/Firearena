'use client';
import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import MatchFilters from './MatchFilters';
import MatchGrid from './MatchGrid';
import WalletWidget from './WalletWidget';
import LeaderboardPanel from './LeaderboardPanel';
import GlobalChat from './GlobalChat';
import WalletTopupModal from './WalletModal';

// ─── Supabase Client Initialization ──────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Avatar Mapping ─────────────────────────────────────────────────────────
const AVATAR_MAP: Record<string, string> = {
  'av-1': '🎯',
  'av-2': '⚔️',
  'av-3': '🔥',
  'av-4': '💀',
  'av-5': '🦅',
  'av-6': '⚡',
  'av-7': '🐉',
  'av-8': '🌙',
};

export type MatchMode = 'Classic' | 'Clash Squad' | 'Custom' | 'Battle Royale';
export type MatchStatus = 'Registration Open' | 'Upcoming' | 'Live' | 'Completed' | 'Room Sent';

export interface Match {
  id: string;
  title: string;
  mode: MatchMode;
  status: MatchStatus;
  entryFee: number;
  prizePool: number;
  totalSlots: number;
  filledSlots: number;
  filled_slots?: number;
  total_slots?: number;
  date: string;
  time: string;
  map: string;
  perKill: number;
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;
  roomId?: string;
  roomPassword?: string;
  isRegistered?: boolean;
}

interface UserProfile {
  name: string;
  uid: string;
  email: string;
  avatar: string;
}

export default function MatchDashboardContent() {
  const [activeFilter, setActiveFilter] = useState<'All' | MatchMode | MatchStatus>('All');
  const [walletOpen, setWalletOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Dynamic User State
  const [user, setUser] = useState<UserProfile>({
    name: 'Loading...',
    uid: '...',
    email: 'Loading...',
    avatar: '🎯',
  });

  // Fetch Logged-in User Data & Sync Matches Slots from Supabase
  useEffect(() => {
    const loadUserDataAndMatches = async () => {
      // 1. Fetch live user session from Supabase
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();

      if (supabaseUser) {
        const metadata = supabaseUser.user_metadata || {};
        const avatarKey = metadata.avatar || 'av-1';
        const avatarEmoji = AVATAR_MAP[avatarKey] || (avatarKey.length <= 2 ? avatarKey : '🎯');

        setUser({
          name: metadata.player_name || metadata.name || 'Soldier',
          uid: metadata.uid || 'N/A',
          email: supabaseUser.email || 'N/A',
          avatar: avatarEmoji,
        });
      } else {
        // 2. Fallback to localStorage
        const storedUser = localStorage.getItem('firearena_user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            const avatarKey = parsed.avatar || 'av-1';
            const avatarEmoji = AVATAR_MAP[avatarKey] || (avatarKey.length <= 2 ? avatarKey : '🎯');

            setUser({
              name: parsed.player_name || parsed.name || 'YourGameTag',
              uid: parsed.uid || '1234567890',
              email: parsed.email || 'soldier@email.com',
              avatar: avatarEmoji,
            });
          } catch (e) {
            console.error('Failed to parse user data', e);
          }
        }
      }

      // 3. Sync matches filled slots from Supabase match_participants table
      try {
        const savedMatches = localStorage.getItem('firearena_matches');
        if (savedMatches) {
          const parsedMatches: Match[] = JSON.parse(savedMatches);
          
          // Loop through matches and update filled slots based on actual participants table
          const updatedMatches = await Promise.all(
            parsedMatches.map(async (m) => {
              const { count, error } = await supabase
                .from('match_participants')
                .select('*', { count: 'exact', head: true })
                .eq('match_id', m.id);

              if (!error && count !== null) {
                return { ...m, filledSlots: count, filled_slots: count };
              }
              return m;
            })
          );

          localStorage.setItem('firearena_matches', JSON.stringify(updatedMatches));
        }
      } catch (err) {
        console.error('Error syncing match slots:', err);
      }
    };

    loadUserDataAndMatches();

    // Listen for Auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const metadata = session.user.user_metadata || {};
        const avatarKey = metadata.avatar || 'av-1';
        const avatarEmoji = AVATAR_MAP[avatarKey] || (avatarKey.length <= 2 ? avatarKey : '🎯');

        setUser({
          name: metadata.player_name || metadata.name || 'Soldier',
          uid: metadata.uid || 'N/A',
          email: session.user.email || 'N/A',
          avatar: avatarEmoji,
        });
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Logout Function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('firearena_user');
    window.location.href = '/'; // Redirection to home/login page
  };

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

      {/* Page Header with Profile & Logout */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground tracking-wider">
            MATCH <span className="text-gradient-cyan">DASHBOARD</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            20 Jul 2026 • 08:15 IST • <span className="text-neon-green">48,293 players online</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setWalletOpen(true)}
            className="btn-neon-orange rounded-lg px-4 py-2.5 font-display font-bold tracking-wider text-sm flex items-center gap-2 cursor-pointer"
          >
            + Add Funds
          </button>

          {/* Profile & Logout Section */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-2 hover:bg-muted/50 transition cursor-pointer"
            >
              {/* Selected Avatar */}
              <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-lg">
                {user.avatar}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-foreground leading-tight">{user.name}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">UID: {user.uid}</p>
              </div>
              <span className="text-xs text-muted-foreground ml-1">▼</span>
            </button>

            {/* Dropdown Menu (Profile Info + Logout) */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl py-3 px-4 z-50 space-y-3">
                <div className="border-b border-border pb-3">
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="text-sm font-bold text-foreground truncate">{user.email}</p>
                  <div className="mt-2 text-xs bg-muted/60 rounded-lg p-2 space-y-1">
                    <p className="text-foreground"><span className="text-muted-foreground">Name:</span> {user.name}</p>
                    <p className="text-foreground"><span className="text-muted-foreground">UID:</span> {user.uid}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg py-2 text-xs font-bold tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  🚪 LOGOUT
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 2xl:grid-cols-4 gap-6">
        {/* Left: Matches */}
        <div className="xl:col-span-3 space-y-5">
          <MatchFilters activeFilter={activeFilter} onFilter={setActiveFilter} />
          <MatchGrid activeFilter={activeFilter} />
        </div>

        {/* Right: Sidebar Panels */}
        <div className="xl:col-span-1 space-y-5">
          <WalletWidget onAddFunds={() => setWalletOpen(true)} />
          <LeaderboardPanel />
          <GlobalChat />
        </div>
      </div>

      {walletOpen && <WalletTopupModal onClose={() => setWalletOpen(false)} />}
    </div>
  );
}