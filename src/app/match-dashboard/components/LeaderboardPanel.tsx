'use client';
import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
// Centralized Supabase client import karein
import { supabase } from '@/lib/supabaseClient';

const RANK_STYLE: Record<number, string> = {
  1: 'leaderboard-row-gold',
  2: 'leaderboard-row-silver',
  3: 'leaderboard-row-bronze',
};

type LBSort = 'kills' | 'wins' | 'earnings';

export default function LeaderboardPanel() {
  const [sort, setSort] = useState<LBSort>('kills');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);

      // Pehle hum saare profiles fetch kar lete hain taaki missing column ki wajah se query fail na ho
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (!error && data) {
        // Javascript ke andar hi data ko safely sort kar lete hain
        const sortedData = [...data].sort((a, b) => {
          let valA = 0;
          let valB = 0;

          if (sort === 'kills') {
            valA = Number(a.kills || 0);
            valB = Number(b.kills || 0);
          } else if (sort === 'wins') {
            valA = Number(a.wins || a.total_wins || 0);
            valB = Number(b.wins || b.total_wins || 0);
          } else if (sort === 'earnings') {
            valA = Number(a.earnings || a.total_earnings || 0);
            valB = Number(b.earnings || b.total_earnings || 0);
          }

          return valB - valA; // Descending order (highest first)
        });

        setLeaderboardData(sortedData.slice(0, 10)); // Top 10 players
      } else {
        console.error("Error fetching leaderboard:", error?.message);
      }
      setLoading(false);
    }

    fetchLeaderboard();

    // Supabase Realtime Listener
    const channel = supabase
      .channel('public:profiles_leaderboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sort]);

  return (
    <div className="card-surface rounded-xl overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-neon-orange" />
            <h3 className="font-display font-bold text-sm tracking-wider text-foreground">LEADERBOARD</h3>
          </div>
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
        {/* Sort Tabs */}
        <div className="flex gap-1">
          {(['kills', 'wins', 'earnings'] as LBSort[]).map((s) => (
            <button
              key={`lb-sort-${s}`}
              onClick={() => setSort(s)}
              className={`flex-1 text-xs py-1.5 rounded font-display font-semibold tracking-wider transition-all ${
                sort === s
                  ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30'
                  : 'text-muted-foreground hover:text-foreground bg-muted/30'
              }`}
            >
              {s === 'kills' ? '🎯 KILLS' : s === 'wins' ? '🏆 WINS' : '💰 EARN'}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-border min-h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-xs text-muted-foreground animate-pulse">Loading live leaderboard...</p>
          </div>
        ) : leaderboardData.length > 0 ? (
          leaderboardData.map((player, idx) => {
            const rowClass = RANK_STYLE[idx + 1] ?? '';
            const playerName = player.username || player.name || 'Anonymous';
            const playerAvatar = player.avatar || '🎮';
            const playerKills = player.kills || 0;
            const playerWins = player.wins || player.total_wins || 0;
            const playerEarnings = player.earnings || player.total_earnings || 0;

            return (
              <div
                key={player.id || idx}
                className={`flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors ${rowClass}`}
              >
                {/* Rank */}
                <div className="w-5 text-center shrink-0">
                  {idx + 1 <= 3 ? (
                    <span className="text-sm">
                      {idx + 1 === 1 ? '🥇' : idx + 1 === 2 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    <span className="text-xs font-display font-bold text-muted-foreground">
                      {idx + 1}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <span className="text-base">{playerAvatar}</span>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{playerName}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{playerWins}W</span>
                    <span className="text-[10px] text-muted-foreground">{playerKills}K</span>
                  </div>
                </div>

                {/* Sort Value */}
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold font-display tabular-nums text-neon-cyan">
                    {sort === 'earnings'
                      ? `₹${Number(playerEarnings).toLocaleString('en-IN')}`
                      : sort === 'kills'
                      ? `${playerKills}`
                      : `${playerWins}`}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center py-10">
            <p className="text-xs text-muted-foreground">No leaderboard data available.</p>
          </div>
        )}
      </div>
    </div>
  );
}