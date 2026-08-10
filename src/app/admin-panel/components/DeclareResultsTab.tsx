'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Trophy, Target, Users, CheckCircle, ChevronDown, AlertTriangle, Loader2, RefreshCw, Search, Download } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface ResultPlayer {
  id: string; // row id
  userId: string;
  name: string;
  avatar: string;
  kills: number;
  placement: number | null;
  prizeEarned: number;
  teamId?: string;
}

interface MatchResult {
  matchId: string;
  title: string;
  mode: string;
  date: string;
  prizePool: number;
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;
  perKill: number;
  status: 'Pending Results' | 'Results Declared';
  players: ResultPlayer[];
}

export default function DeclareResultsTab() {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [killInputs, setKillInputs] = useState<Record<string, number>>({});
  const [placementInputs, setPlacementInputs] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  
  // New States for Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });

      let allMatches = matchesData || [];

      if (allMatches.length === 0) {
        allMatches = JSON.parse(localStorage.getItem('firearena_matches') || '[]');
      }

      if (!allMatches || allMatches.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      const formattedMatches: MatchResult[] = await Promise.all(
        allMatches.map(async (m: any) => {
          const mId = m.id;
          const mIdStr = String(m.id);

          let fetchedPlayers: any[] = [];

          let { data: partData, error: partErr } = await supabase
            .from('match_participants')
            .select('*, profiles(username, avatar, name)')
            .eq('match_id', mId);

          if (partErr) {
            const { data: rawPartData } = await supabase
              .from('match_participants')
              .select('*')
              .eq('match_id', mId);
            partData = rawPartData;
          }

          if (partData && partData.length > 0) {
            fetchedPlayers = partData;
          }

          if (fetchedPlayers.length === 0) {
            let { data: playerTableData, error: playerErr } = await supabase
              .from('match_players')
              .select('*, profiles(username, avatar, name)')
              .eq('match_id', mId);

            if (playerErr) {
              const { data: rawPlayerTableData } = await supabase
                .from('match_players')
                .select('*')
                .eq('match_id', mId);
              playerTableData = rawPlayerTableData;
            }

            if (playerTableData && playerTableData.length > 0) {
              fetchedPlayers = playerTableData;
            }
          }

          const regKeys = ['tournament_registrations', 'firearena_joined_matches', 'joined_matches', 'match_registrations', 'firearena_registrations'];
          let allLocalRegs: any[] = [];
          regKeys.forEach((key) => {
            const items = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(items)) {
              allLocalRegs = [...allLocalRegs, ...items];
            }
          });

          const matchLocalRegs = allLocalRegs.filter(
            (r: any) => String(r.matchId || r.match_id || r.id || r.tournamentId) === mIdStr
          );

          if (fetchedPlayers.length === 0 && matchLocalRegs.length > 0) {
            fetchedPlayers = matchLocalRegs.map((r: any, idx: number) => ({
              id: r.id || r.uid || `local_${idx}`,
              user_id: r.uid || r.user_id || r.userId,
              in_game_name: r.name || r.player_name || r.username || r.in_game_name || 'Player',
              avatar: r.avatar || '🎯',
              kills: r.kills || 0,
              placement: r.placement || null,
              prize_earned: r.prize_earned || 0,
              team_id: r.team_id || r.squad_id || r.teamId || null,
            }));
          }

          const players: ResultPlayer[] = fetchedPlayers.map((p: any, idx: number) => ({
            id: p.id || `p_${idx}`,
            userId: p.user_id || p.uid || p.userId || '',
            name: p.profiles?.username || p.profiles?.name || p.player_name || p.in_game_name || p.name || p.username || `Player_${idx + 1}`,
            avatar: p.profiles?.avatar || p.avatar || '🎯',
            kills: Number(p.kills || 0),
            placement: p.placement !== null && p.placement !== undefined ? Number(p.placement) : null,
            prizeEarned: Number(p.prize_earned || p.prizeEarned || 0),
            teamId: p.team_id || p.squad_id || p.team_code || p.teamId || null,
          }));

          let teamSize = 1;
          const matchType = ((m.mode || '') + " " + (m.title || '')).toLowerCase();
          
          if (matchType.includes('duo') || matchType.includes('2v2') || matchType.includes('duos')) {
            teamSize = 2;
          } else if (matchType.includes('squad') || matchType.includes('4v4') || matchType.includes('full')) {
            teamSize = 4;
          } else {
            if (players.length === 2) teamSize = 2;
            else if (players.length === 4 || players.length === 8 || players.length === 12) teamSize = 4;
          }

          const hasValidTeamIds = players.some(p => p.teamId);

          if (!hasValidTeamIds && teamSize > 1) {
            let currentTeamId = 1;
            for (let i = 0; i < players.length; i++) {
              players[i].teamId = `auto_team_${mIdStr}_${currentTeamId}`;
              if ((i + 1) % teamSize === 0) {
                currentTeamId++;
              }
            }
          } else if (!hasValidTeamIds) {
            players.forEach((p, idx) => {
              p.teamId = `auto_team_${mIdStr}_${Math.floor(idx / 1) + 1}`;
            });
          }

          return {
            matchId: mIdStr,
            title: m.title || m.name || 'Custom Match',
            mode: m.mode || 'Classic',
            date: m.start_time || m.created_at
              ? new Date(m.start_time || m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : 'Today',
            prizePool: Number(m.prize_pool || m.prizePool || 0),
            firstPlace: Number(m.first_place || m.firstPrize || m['1st'] || 0),
            secondPlace: Number(m.second_place || m.secondPrize || m['2nd'] || 0),
            thirdPlace: Number(m.third_place || m.thirdPrize || m['3rd'] || 0),
            perKill: Number(m.per_kill || m.perKill || 0),
            status: m.status === 'Completed' || m.status === 'Results Declared' ? 'Results Declared' : 'Pending Results',
            players,
          };
        })
      );

      setMatches(formattedMatches);
      if (formattedMatches.length > 0 && !expandedMatch) {
        setExpandedMatch(formattedMatches[0].matchId);
      }
    } catch (err: any) {
      console.error('Error fetching matches:', err.message);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleKillChange = (playerId: string, value: number) => {
    setKillInputs((prev) => ({ ...prev, [playerId]: value }));
  };

  const handlePlacementChange = (teamPlayers: ResultPlayer[], value: number) => {
    setPlacementInputs((prev) => {
      const newInputs = { ...prev };
      teamPlayers.forEach(p => {
        newInputs[p.id] = value;
      });
      return newInputs;
    });
  };

  const calculatePrize = (playerId: string, match: MatchResult): number => {
    const kills = killInputs[playerId] ?? 0;
    const player = match.players.find(p => p.id === playerId);
    const teamId = player?.teamId || playerId;
    const teamMembers = match.players.filter(p => (p.teamId || p.id) === teamId);
    
    let placement: number | null = placementInputs[playerId];
    if (placement === undefined) {
      const memberWithInput = teamMembers.find(tm => placementInputs[tm.id] !== undefined);
      if (memberWithInput) {
        placement = placementInputs[memberWithInput.id];
      } else {
        placement = player?.placement ?? null;
      }
    }

    const killBonus = kills * match.perKill;
    let placementPrize = 0;
    if (placement === 1) placementPrize = match.firstPlace;
    else if (placement === 2) placementPrize = match.secondPlace;
    else if (placement === 3) placementPrize = match.thirdPlace;

    const teamMembersCount = teamMembers.length > 0 ? teamMembers.length : 1;
    return killBonus + (placementPrize / teamMembersCount);
  };

  const handleDeclare = async (match: MatchResult) => {
    setSubmitting(match.matchId);

    try {
      await supabase
        .from('matches')
        .update({ status: 'Completed' })
        .eq('id', match.matchId);

      const localMatches = JSON.parse(localStorage.getItem('firearena_matches') || '[]');
      const updatedLocalMatches = localMatches.map((m: any) =>
        String(m.id) === match.matchId ? { ...m, status: 'Completed' } : m
      );
      localStorage.setItem('firearena_matches', JSON.stringify(updatedLocalMatches));

      for (const player of match.players) {
        const kills = killInputs[player.id] ?? player.kills ?? 0;
        const teamId = player.teamId || player.id;
        const teamMembers = match.players.filter(p => (p.teamId || p.id) === teamId);
        let placement: number | null = placementInputs[player.id];
        if (placement === undefined) {
          const memberWithInput = teamMembers.find(tm => placementInputs[tm.id] !== undefined);
          placement = memberWithInput ? placementInputs[memberWithInput.id] : (player.placement ?? null);
        }

        const prizeEarned = calculatePrize(player.id, match);

        await supabase
          .from('match_participants')
          .update({ kills, placement, prize_earned: prizeEarned })
          .eq('id', player.id);

        await supabase
          .from('match_players')
          .update({ kills, placement, prize_earned: prizeEarned })
          .eq('id', player.id);

        if (prizeEarned > 0 && player.userId) {
          const { data: walletData } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', player.userId)
            .single();

          if (walletData) {
            const currentWalletBal = Number(walletData.balance || 0);
            await supabase
              .from('wallets')
              .update({ balance: currentWalletBal + prizeEarned })
              .eq('user_id', player.userId);
          } else {
            await supabase
              .from('wallets')
              .insert([{ user_id: player.userId, balance: prizeEarned }]);
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('balance, wallet_balance, earnings, kills, wins')
            .eq('id', player.userId)
            .single();

          if (profile) {
            const currentBal = Number(profile.balance || profile.wallet_balance || 0);
            await supabase
              .from('profiles')
              .update({
                balance: currentBal + prizeEarned,
                wallet_balance: currentBal + prizeEarned,
                earnings: Number(profile.earnings || 0) + prizeEarned,
                kills: Number(profile.kills || 0) + kills,
                wins: placement === 1 ? Number(profile.wins || 0) + 1 : Number(profile.wins || 0),
              })
              .eq('id', player.userId);
          }

          await supabase
            .from('transactions')
            .insert([
              {
                user_id: player.userId,
                type: 'Tournament Win',
                amount: prizeEarned,
                description: `Won prize in match: ${match.title}`,
                created_at: new Date().toISOString()
              }
            ]);
        }
      }

      // 🔥 Leaderboard Live Update Trigger
      window.dispatchEvent(new Event('leaderboard_updated'));

      toast.success(`Results declared & funds successfully added to winners' wallets! 🏆`);
      fetchMatches();
    } catch (err: any) {
      toast.error('Failed to update result: ' + err.message);
    } finally {
      setSubmitting(null);
    }
  };

  // Export Match Results to CSV
  const exportToCSV = (match: MatchResult) => {
    const headers = ['Player Name', 'User ID', 'Kills', 'Placement', 'Prize Earned (INR)'];
    const rows = match.players.map(p => [
      `"${p.name}"`,
      `"${p.userId || 'N/A'}"`,
      p.kills,
      p.placement || 'N/A',
      match.status === 'Results Declared' ? p.prizeEarned : calculatePrize(p.id, match)
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${match.title.replace(/\s+/g, '_')}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Results exported as CSV successfully!');
  };

  // Filter matches based on search query
  const filteredMatches = matches.map(match => {
    if (!searchQuery.trim()) return match;
    const query = searchQuery.toLowerCase();
    const matchingPlayers = match.players.filter(p => 
      p.name.toLowerCase().includes(query) || p.userId.toLowerCase().includes(query)
    );
    if (match.title.toLowerCase().includes(query) || matchingPlayers.length > 0) {
      return { ...match, players: matchingPlayers.length > 0 ? matchingPlayers : match.players };
    }
    return null;
  }).filter(Boolean) as MatchResult[];

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 bg-card-surface p-4 rounded-xl border border-border">
        <div>
          <p className="font-display font-bold text-foreground text-sm">Results Management</p>
          <p className="text-xs text-muted-foreground">Manage scores, view players and distribute rewards instantly</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search player or match..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:border-neon-cyan"
            />
          </div>
          <button
            onClick={fetchMatches}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-foreground px-3 py-2 rounded-lg text-xs font-semibold border border-border transition-all cursor-pointer"
            title="Force Sync"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="card-surface rounded-xl p-4 border border-neon-orange/30 bg-neon-orange/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-neon-orange" />
            <p className="text-xs text-muted-foreground tracking-wider">Pending Matches</p>
          </div>
          <p className="font-display font-bold text-2xl text-neon-orange">
            {matches.filter((m) => m.status === 'Pending Results').length}
          </p>
        </div>
        <div className="card-surface rounded-xl p-4 border border-neon-green/30 bg-neon-green/5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} className="text-neon-green" />
            <p className="text-xs text-muted-foreground tracking-wider">Declared Matches</p>
          </div>
          <p className="font-display font-bold text-2xl text-neon-green">
            {matches.filter((m) => m.status === 'Results Declared').length}
          </p>
        </div>
        <div className="card-surface rounded-xl p-4 border border-neon-cyan/30 bg-neon-cyan/5 col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={14} className="text-neon-cyan" />
            <p className="text-xs text-muted-foreground tracking-wider">Total Prizes Distributed</p>
          </div>
          <p className="font-display font-bold text-2xl text-neon-cyan tabular-nums">
            ₹{matches
              .filter((m) => m.status === 'Results Declared')
              .reduce((sum, m) => sum + m.players.reduce((s, p) => s + p.prizeEarned, 0), 0)
              .toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card-surface rounded-xl py-20 text-center flex flex-col items-center justify-center gap-3 border border-border">
          <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
          <p className="text-sm text-muted-foreground">Fetching matches and player details...</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="card-surface rounded-xl py-16 text-center border border-border">
          <Trophy size={36} className="text-muted-foreground mx-auto mb-3" />
          <p className="font-display font-bold text-foreground tracking-wider">No Matches Found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search query or create a match.</p>
        </div>
      ) : (
        filteredMatches.map((match) => {
          const isExpanded = expandedMatch === match.matchId;
          const isPending = match.status === 'Pending Results';

          const groupedPlayers = match.players.reduce((acc, player) => {
            const key = player.teamId || player.id;
            if (!acc[key]) acc[key] = [];
            acc[key].push(player);
            return acc;
          }, {} as Record<string, ResultPlayer[]>);
          
          let teamCounter = 1;

          return (
            <div
              key={match.matchId}
              className={`card-surface rounded-xl border overflow-hidden ${
                isPending ? 'border-neon-orange/30' : 'border-border'
              }`}
            >
              <div className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
                <button
                  onClick={() => setExpandedMatch(isExpanded ? null : match.matchId)}
                  className="flex items-center gap-3 flex-1 text-left cursor-pointer"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isPending ? 'bg-neon-orange/15' : 'bg-neon-green/15'}`}>
                    <Trophy size={18} className={isPending ? 'text-neon-orange' : 'text-neon-green'} />
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm text-foreground tracking-wider">{match.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{match.mode}</span>
                      <span className="text-muted-foreground/30">•</span>
                      <span className="text-xs text-muted-foreground">{match.date}</span>
                      <span className="text-muted-foreground/30">•</span>
                      <span className="text-xs font-bold text-neon-orange">₹{match.prizePool.toLocaleString('en-IN')} Pool</span>
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => exportToCSV(match)}
                    className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-foreground px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-border transition-all cursor-pointer"
                    title="Export CSV"
                  >
                    <Download size={13} />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                  <span className={`text-xs font-bold font-display tracking-wider px-3 py-1 rounded ${
                    isPending ? 'status-live' : 'status-registration'
                  }`}>
                    {isPending ? 'PENDING' : 'DECLARED'}
                  </span>
                  <button onClick={() => setExpandedMatch(isExpanded ? null : match.matchId)} className="cursor-pointer">
                    <ChevronDown
                      size={16}
                      className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border animate-slide-up">
                  <div className="p-4">
                    <div className="bg-muted/20 border border-border rounded-xl p-2.5 mb-4 text-xs flex flex-wrap justify-between items-center gap-2">
                      <span className="text-muted-foreground font-semibold">🏆 Prize Breakdown:</span>
                      <div className="flex gap-3">
                        <span>🥇 1st: <strong className="text-yellow-400">₹{match.firstPlace}</strong></span>
                        <span>🥈 2nd: <strong className="text-slate-300">₹{match.secondPlace}</strong></span>
                        <span>🥉 3rd: <strong className="text-amber-600">₹{match.thirdPlace}</strong></span>
                        <span>🎯 Kill: <strong className="text-neon-cyan">₹{match.perKill}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <Users size={14} className="text-neon-cyan" />
                      <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                        Joined Players — ({match.players.length})
                      </p>
                    </div>

                    {match.players.length === 0 ? (
                      <div className="text-center py-6 bg-background/50 rounded-lg border border-dashed border-border">
                        <p className="text-sm text-muted-foreground mb-1">No players match your search filter.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left pb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Player Name</th>
                              <th className="text-center pb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Kills</th>
                              <th className="text-center pb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Rank/Placement</th>
                              <th className="text-right pb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Payout Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {Object.entries(groupedPlayers).map(([teamId, teamPlayers]) => {
                              const currentTeamNum = teamCounter++;
                              const sharedPlacement = placementInputs[teamPlayers[0]?.id] ?? teamPlayers[0]?.placement ?? '';

                              return (
                                <React.Fragment key={teamId}>
                                  {teamPlayers.length > 1 && (
                                    <tr className="bg-white/5 border-b border-border/50">
                                      <td colSpan={4} className="py-2 px-3 text-xs font-bold text-neon-cyan/70 uppercase tracking-widest">
                                        Team / Squad {currentTeamNum}
                                      </td>
                                    </tr>
                                  )}
                                  
                                  {teamPlayers.map((player) => {
                                    const isDeclared = match.status === 'Results Declared';
                                    const prize = isDeclared ? player.prizeEarned : calculatePrize(player.id, match);

                                    return (
                                      <tr key={player.id} className="hover:bg-white/5 transition-colors">
                                        <td className="py-3 pl-2">
                                          <div className="flex items-center gap-2.5">
                                            <span className="text-lg">{player.avatar}</span>
                                            <div>
                                              <span className="font-semibold text-sm text-foreground block">{player.name}</span>
                                              <span className="text-[10px] text-muted-foreground font-mono">UID: {player.userId || 'N/A'}</span>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="py-3 text-center">
                                          {isDeclared ? (
                                            <span className="font-display font-bold text-neon-cyan tabular-nums">{player.kills}</span>
                                          ) : (
                                            <input
                                              type="number"
                                              min={0}
                                              value={killInputs[player.id] ?? ''}
                                              onChange={(e) => handleKillChange(player.id, parseInt(e.target.value) || 0)}
                                              className="input-gaming w-16 rounded-lg px-2 py-1.5 text-center text-sm font-display font-bold mx-auto block bg-background border border-border text-foreground"
                                              placeholder="0"
                                            />
                                          )}
                                        </td>
                                        <td className="py-3 text-center">
                                          {isDeclared ? (
                                            <span className="font-display font-bold text-neon-orange">
                                              {player.placement ? (player.placement === 1 ? '🥇 #1' : player.placement === 2 ? '🥈 #2' : player.placement === 3 ? '🥉 #3' : `#${player.placement}`) : 'No Rank'}
                                            </span>
                                          ) : (
                                            <select
                                              value={sharedPlacement}
                                              onChange={(e) => handlePlacementChange(teamPlayers, parseInt(e.target.value) || 0)}
                                              className="input-gaming rounded-lg px-2 py-1.5 text-sm mx-auto block w-28 bg-background border border-border text-foreground"
                                            >
                                              <option value="">— Rank —</option>
                                              <option value={1}>🥇 #1 Winner</option>
                                              <option value={2}>🥈 #2 Winner</option>
                                              <option value={3}>🥉 #3 Winner</option>
                                              {Array.from({ length: 47 }, (_, i) => i + 4).map((pos) => (
                                                <option key={`pos-${player.id}-${pos}`} value={pos}>
                                                  #{pos}
                                                </option>
                                              ))}
                                            </select>
                                          )}
                                        </td>
                                        <td className="py-3 text-right pr-2">
                                          <span className={`font-display font-bold tabular-nums ${prize > 0 ? 'text-neon-green' : 'text-muted-foreground'}`}>
                                            ₹{prize.toLocaleString('en-IN')}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {isPending && match.players.length > 0 && (
                      <div className="mt-4 flex flex-wrap items-center justify-between border-t border-border pt-4 gap-3">
                        <div className="bg-neon-green/10 border border-neon-green/20 rounded-lg px-4 py-2">
                          <span className="text-xs text-muted-foreground">Total Payout: </span>
                          <span className="font-display font-bold text-neon-green tabular-nums">
                            ₹{match.players.reduce((sum, p) => sum + calculatePrize(p.id, match), 0).toLocaleString('en-IN')}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeclare(match)}
                          disabled={submitting === match.matchId}
                          className="bg-neon-orange hover:bg-neon-orange/90 text-black font-display font-bold rounded-xl px-6 py-2.5 tracking-widest text-xs uppercase flex items-center gap-2 disabled:opacity-60 transition-all cursor-pointer"
                        >
                          {submitting === match.matchId ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Adding to Wallets...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={15} />
                              Declare Results & Distribute Funds
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}