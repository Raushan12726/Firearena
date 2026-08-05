'use client';
import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import MatchFilters from './MatchFilters';
import MatchGrid from './MatchGrid';
import WalletWidget from './WalletWidget';
import LeaderboardPanel from './LeaderboardPanel';
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
export type MatchType = 'solo' | 'duo' | 'squad';

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
  matchType?: MatchType;
  type?: MatchType;
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

  // Live DateTime & Players Count State
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [onlinePlayers, setOnlinePlayers] = useState(48293);

  // Dynamic User State
  const [user, setUser] = useState<UserProfile>({
    name: 'Loading...',
    uid: '...',
    email: 'Loading...',
    avatar: '🎯',
  });

  // Live Clock & Player Count Effect
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      };
      setCurrentDateTime(now.toLocaleString('en-IN', options) + ' IST');
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);

    const playerTimer = setInterval(() => {
      setOnlinePlayers((prev) => {
        const change = Math.floor(Math.random() * 11) - 5;
        return Math.max(40000, prev + change);
      });
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(playerTimer);
    };
  }, []);

  // Fetch Logged-in User Data & Sync Matches with exact match_participants count
  useEffect(() => {
    const loadUserDataAndMatches = async () => {
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

      try {
        const { data: dbMatches, error } = await supabase
          .from('matches')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && dbMatches) {
          const formattedMatches: Match[] = await Promise.all(
            dbMatches.map(async (m: any) => {
              const { count, error: countErr } = await supabase
                .from('match_participants')
                .select('*', { count: 'exact', head: true })
                .eq('match_id', m.id);

              const actualFilledSlots = !countErr && count !== null ? count : Number(m.filled_slots || 0);
              const resolvedType = (m.match_type || m.matchType || m.type || 'solo').toLowerCase() as MatchType;

              return {
                id: String(m.id),
                title: m.title || m.name || 'Tournament Match',
                mode: (m.mode || 'Classic') as MatchMode,
                status: (m.status || 'Registration Open') as MatchStatus,
                entryFee: Number(m.entry_fee || 0),
                prizePool: Number(m.prize_pool || 0),
                totalSlots: Number(m.total_slots || 50),
                filledSlots: actualFilledSlots,
                date: m.date || 'Today',
                time: m.time || m.start_time || '00:00',
                map: m.map || 'Bermuda',
                perKill: Number(m.per_kill || 0),
                firstPlace: Number(m.first_place || 0),
                secondPlace: Number(m.second_place || 0),
                thirdPlace: Number(m.third_place || 0),
                roomId: m.room_id || '',
                roomPassword: m.room_password || '',
                matchType: resolvedType,
                type: resolvedType,
              };
            })
          );

          localStorage.setItem('firearena_matches', JSON.stringify(formattedMatches));
          window.dispatchEvent(new Event('storage'));
        }
      } catch (err) {
        console.error('Error fetching matches from Supabase:', err);
      }
    };

    loadUserDataAndMatches();

    const realtimeChannel = supabase
      .channel('public:match_participants_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_participants',
        },
        () => {
          loadUserDataAndMatches();
        }
      )
      .subscribe();

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
      supabase.removeChannel(realtimeChannel);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('firearena_user');
    window.location.href = '/'; 
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-16 py-4 sm:py-6 pb-20 sm:pb-6">
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

      {/* Responsive Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="space-y-3">
          {/* Logo & Subtext added directly above MATCH DASHBOARD */}
          <div className="flex items-center gap-3">
            <img 
              src="/assets/images/garena_free_fire_india_logo.jpg" 
              alt="Garena Free Fire India Logo" 
              className="w-10 h-10 rounded-lg object-cover border border-cyan-500/40 shadow-[0_0_10px_rgba(0,212,255,0.2)]"
            />
            <span className="font-display text-xs sm:text-sm font-bold tracking-widest text-cyan-400 uppercase">
              Free Fire India 🇮🇳 Tournament Hub
            </span>
          </div>

          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-wider">
              MATCH <span className="text-gradient-cyan">DASHBOARD</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {currentDateTime || 'Loading time...'} • <span className="text-neon-green font-semibold">{onlinePlayers.toLocaleString()} players online</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full md:w-auto">
          <button
            onClick={() => setWalletOpen(true)}
            className="btn-neon-orange rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 font-display font-bold tracking-wider text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
          >
            + Add Funds
          </button>

          {/* Profile & Logout Section */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 sm:gap-3 bg-card border border-border rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 hover:bg-muted/50 transition cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-base sm:text-lg">
                {user.avatar}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-foreground leading-tight max-w-[100px] truncate">{user.name}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">UID: {user.uid}</p>
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground ml-1">▼</span>
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 sm:w-64 bg-card border border-border rounded-xl shadow-xl py-3 px-4 z-50 space-y-3">
                <div className="border-b border-border pb-3">
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="text-xs sm:text-sm font-bold text-foreground truncate">{user.email}</p>
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

      {/* Main Responsive Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 2xl:grid-cols-4 gap-6">
        {/* Left Section: Filters & Matches */}
        <div className="xl:col-span-3 space-y-5 overflow-x-hidden">
          <MatchFilters activeFilter={activeFilter} onFilter={setActiveFilter} />
          <MatchGrid activeFilter={activeFilter} />
        </div>

        {/* Right Section: Sidebar Panels */}
        <div className="xl:col-span-1 space-y-5">
          <WalletWidget onAddFunds={() => setWalletOpen(true)} />
          <LeaderboardPanel />

          {/* Desktop Customer Support Widget */}
          <div className="hidden sm:block bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Customer Support</p>
            <a 
              href="https://wa.me/917260069533?text=Hi,%20Mujhe%20support%20chahiye" 
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg py-2 px-3 text-xs font-bold tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
            >
              💬 WhatsApp Support
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Floating WhatsApp Button */}
      <a 
        href="https://wa.me/917260069533?text=Hi,%20Mujhe%20support%20chahiye"
        target="_blank"
        rel="noopener noreferrer"
        className="sm:hidden fixed bottom-4 right-4 bg-green-500 hover:bg-green-600 text-black font-bold px-4 py-2.5 rounded-full shadow-lg z-50 flex items-center gap-2 text-xs border border-green-400"
      >
        💬 WhatsApp Support
      </a>

      {walletOpen && <WalletTopupModal onClose={() => setWalletOpen(false)} />}
    </div>
  );
}