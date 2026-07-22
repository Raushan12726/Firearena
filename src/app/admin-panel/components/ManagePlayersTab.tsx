'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, Users, Ban, Eye, Trophy, TrendingUp, ChevronDown, ChevronUp, Filter, Loader2 } from 'lucide-react';
// Centralized Supabase client import karein
import { supabase } from '@/lib/supabaseClient';

interface Player {
  id: string;
  name: string;
  uid: string;
  email: string;
  phone: string;
  avatar: string;
  kills: number;
  wins: number;
  matches: number;
  earnings: number;
  walletBalance: number;
  status: 'Active' | 'Suspended' | 'Pending';
  joinedDate: string;
  lastActive: string;
}

const STATUS_BADGE: Record<Player['status'], string> = {
  Active: 'status-registration',
  Suspended: 'bg-red-500/15 text-red-400 border border-red-500/30',
  Pending: 'status-upcoming',
};

type SortKey = 'kills' | 'wins' | 'earnings' | 'matches';

export default function ManagePlayersTab() {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('kills');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'All' | Player['status']>('All');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch players from Supabase profiles table
  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;

      if (data) {
        const formattedPlayers: Player[] = data.map((item: any, index: number) => ({
          id: item.id,
          name: item.username || item.name || `Player_${index + 1}`,
          uid: item.uid || String(1000000000 + index),
          email: item.email || `${(item.username || 'player').toLowerCase()}@firearena.gg`,
          phone: item.phone || '+91 98765 43210',
          avatar: item.avatar || '🎯',
          kills: item.kills || 0,
          wins: item.wins || 0,
          matches: item.matches || 0,
          earnings: Number(item.earnings || 0),
          walletBalance: Number(item.balance || 0),
          status: item.status || 'Active',
          joinedDate: item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '2026',
          lastActive: 'Live'
        }));
        setPlayers(formattedPlayers);
      }
    } catch (err: any) {
      console.error('Error fetching players:', err.message);
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();

    // Setup Supabase Real-time Subscription for Live Updates
    const channel = supabase
      .channel('public:profiles')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log('Realtime player update received:', payload);
          fetchPlayers(); // Refresh list instantly when database changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = players
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.uid.includes(search) ||
        p.email.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const dir = sortDir === 'desc' ? -1 : 1;
      return (a[sortKey] - b[sortKey]) * dir;
    });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const handleSuspend = async (player: Player) => {
    const newStatus = player.status === 'Suspended' ? 'Active' : 'Suspended';
    
    // Update in Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', player.id);

    if (error) {
      toast.error('Failed to update player status');
      return;
    }

    setPlayers((prev) =>
      prev.map((p) => (p.id === player.id ? { ...p, status: newStatus } : p))
    );
    const action = newStatus === 'Suspended' ? 'Suspended' : 'Unsuspended';
    toast.success(`${player.name} — ${action}`);
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortDir === 'desc' ? <ChevronDown size={12} className="text-neon-cyan" /> : <ChevronUp size={12} className="text-neon-cyan" />
    ) : (
      <ChevronDown size={12} className="text-muted-foreground opacity-40" />
    );

  const totalEarningsAll = players.reduce((s, p) => s + p.earnings, 0);
  const activeCount = players.filter(p => p.status === 'Active').length;
  const suspendedCount = players.filter(p => p.status === 'Suspended').length;

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Players', value: players.length.toString(), icon: Users, color: 'text-neon-cyan' },
          { label: 'Active', value: activeCount.toString(), icon: TrendingUp, color: 'text-neon-green' },
          { label: 'Suspended', value: suspendedCount.toString(), icon: Ban, color: 'text-red-400' },
          { label: 'Total Earnings Paid', value: `₹${totalEarningsAll.toLocaleString('en-IN')}`, icon: Trophy, color: 'text-neon-orange' },
        ].map((card) => {
          const IconComponent = card.icon;
          return (
            <div key={`admin-stat-${card.label}`} className="card-surface rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <IconComponent size={14} className={card.color} />
                <p className="text-xs text-muted-foreground tracking-wider">{card.label}</p>
              </div>
              <p className={`font-display font-bold text-xl tabular-nums ${card.color}`}>{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="card-surface rounded-xl p-4 border border-border">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, UID, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-gaming w-full rounded-lg pl-9 pr-4 py-2.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <Filter size={14} className="text-muted-foreground shrink-0" />
            {(['All', 'Active', 'Suspended', 'Pending'] as const).map((s) => (
              <button
                key={`status-filter-${s}`}
                onClick={() => setStatusFilter(s)}
                className={`text-xs px-3 py-2 rounded-lg font-display font-semibold tracking-wider transition-all whitespace-nowrap ${
                  statusFilter === s
                    ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40' : 'text-muted-foreground border border-border hover:border-neon-cyan/30'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card-surface rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
            <p className="text-sm text-muted-foreground">Loading live players data...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-gaming">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Player</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">UID</th>
                    <th
                      className="text-right px-4 py-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase cursor-pointer hover:text-foreground select-none"
                      onClick={() => handleSort('kills')}
                    >
                      <span className="flex items-center justify-end gap-1">Kills <SortIcon col="kills" /></span>
                    </th>
                    <th
                      className="text-right px-4 py-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase cursor-pointer hover:text-foreground select-none"
                      onClick={() => handleSort('wins')}
                    >
                      <span className="flex items-center justify-end gap-1">Wins <SortIcon col="wins" /></span>
                    </th>
                    <th
                      className="text-right px-4 py-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase cursor-pointer hover:text-foreground select-none"
                      onClick={() => handleSort('matches')}
                    >
                      <span className="flex items-center justify-end gap-1">Matches <SortIcon col="matches" /></span>
                    </th>
                    <th
                      className="text-right px-4 py-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase cursor-pointer hover:text-foreground select-none"
                      onClick={() => handleSort('earnings')}
                    >
                      <span className="flex items-center justify-end gap-1">Earnings <SortIcon col="earnings" /></span>
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Wallet</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((player) => (
                    <tr key={player.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{player.avatar}</span>
                          <div>
                            <p className="font-semibold text-foreground text-xs">{player.name}</p>
                            <p className="text-[10px] text-muted-foreground">{player.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-muted-foreground">{player.uid}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-display font-bold text-sm text-neon-cyan tabular-nums">{player.kills}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-display font-bold text-sm text-neon-orange tabular-nums">{player.wins}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs text-muted-foreground tabular-nums">{player.matches}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-display font-bold text-sm text-neon-green tabular-nums">
                          ₹{player.earnings.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-display font-bold text-sm tabular-nums ${player.walletBalance > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                          ₹{player.walletBalance.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold font-display tracking-wider px-2 py-0.5 rounded ${STATUS_BADGE[player.status]}`}>
                          {player.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toast.info(`Viewing ${player.name}'s profile`)}
                            className="p-1.5 rounded hover:bg-neon-cyan/15 text-muted-foreground hover:text-neon-cyan transition-colors"
                            title="View Profile"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => handleSuspend(player)}
                            className={`p-1.5 rounded transition-colors ${
                              player.status === 'Suspended' ? 'hover:bg-neon-green/15 text-muted-foreground hover:text-neon-green' : 'hover:bg-red-500/15 text-muted-foreground hover:text-red-400'
                            }`}
                            title={player.status === 'Suspended' ? 'Unsuspend Player' : 'Suspend Player'}
                          >
                            <Ban size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <Users size={36} className="text-muted-foreground mx-auto mb-3" />
                <p className="font-display font-bold text-foreground tracking-wider">No Players Found</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
              </div>
            )}

            {/* Pagination / Count Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Showing <span className="text-foreground font-semibold">{filtered.length}</span> of{' '}
                <span className="text-foreground font-semibold">{players.length}</span> players (Live Sync Active)
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}