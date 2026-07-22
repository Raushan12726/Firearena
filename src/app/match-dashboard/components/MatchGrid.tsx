'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Users, Clock, Trophy, Zap, Target, Eye, EyeOff, Lock,
  Swords, Settings, Flame, AlertTriangle, CheckCircle2, ChevronRight, ShieldAlert
} from 'lucide-react';
import type { Match, MatchStatus } from './MatchDashboardContent';
import MatchDetailModal from './MatchDetailModal';
import { supabase } from '@/lib/supabaseClient';

const STATUS_CONFIG: Record<MatchStatus, { label: string; class: string; icon: React.ElementType }> = {
  'Registration Open': { label: 'OPEN', class: 'status-registration', icon: CheckCircle2 },
  Upcoming: { label: 'UPCOMING', class: 'status-upcoming', icon: Clock },
  Live: { label: '● LIVE', class: 'status-live', icon: Flame },
  Completed: { label: 'ENDED', class: 'status-completed', icon: CheckCircle2 },
  'Room Sent': { label: 'ROOM SENT', class: 'status-upcoming', icon: Lock },
};

const MODE_ICON: Record<string, React.ElementType> = {
  Classic: Swords,
  'Clash Squad': Zap,
  Custom: Settings,
  'Battle Royale': Target,
};

function MatchCard({ match }: { match: Match }) {
  const [showRoom, setShowRoom] = useState(false);
  const [joined, setJoined] = useState(match.isRegistered ?? false);
  const [joining, setJoining] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Check Supabase & LocalStorage on load to lock join button if already registered
  useEffect(() => {
    const checkIfUserJoined = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const loggedInUserId = user?.id || localStorage.getItem('user_id') || localStorage.getItem('userId');
        const savedUID = localStorage.getItem(`match_${match.id}_uid`) || localStorage.getItem('user_uid');

        const { data, error } = await supabase
          .from('match_participants')
          .select('*')
          .eq('match_id', match.id);

        if (!error && data) {
          const alreadyJoined = data.some((p: any) => 
            (loggedInUserId && p.user_id === loggedInUserId) || 
            (savedUID && p.player_uid === savedUID)
          );

          if (alreadyJoined) {
            setJoined(true);
          }
        }
      } catch (err) {
        console.error("Error checking registration status:", err);
      } finally {
        setLoadingStatus(false);
      }
    };

    checkIfUserJoined();
  }, [match.id]);

  const statusCfg = STATUS_CONFIG[match.status] || STATUS_CONFIG['Registration Open'];
  const StatusIcon = statusCfg.icon;
  const ModeIcon = MODE_ICON[match.mode] ?? Swords;
  const slotsLeft = match.totalSlots - match.filledSlots;
  const fillPercent = (match.filledSlots / match.totalSlots) * 100;
  const isFull = slotsLeft === 0;
  const isCompleted = match.status === 'Completed';
  const isLive = match.status === 'Live';

  const handleJoin = async () => {
    if (joined || isFull || isCompleted || isLive) return;
    setModalOpen(true); // Open modal to enter details
  };

  const isUserJoined = joined || match.isRegistered;

  return (
    <div className={`card-surface rounded-xl overflow-hidden match-card-hover ${isLive ? 'border-neon-orange/40 shadow-[0_0_15px_rgba(255,100,0,0.15)]' : ''}`}>
      <div className={`h-1 ${isLive ? 'bg-neon-orange animate-pulse' : match.status === 'Registration Open' ? 'bg-neon-green' : isCompleted ? 'bg-muted-foreground' : 'bg-neon-cyan'}`} />

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isLive ? 'bg-neon-orange/15' : 'bg-neon-cyan/10'}`}>
              <ModeIcon size={18} className={isLive ? 'text-neon-orange' : 'text-neon-cyan'} />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-sm text-foreground tracking-wider truncate">
                {match.title}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-muted-foreground">{match.mode}</span>
                <span className="text-muted-foreground/30">•</span>
                <span className="text-xs text-muted-foreground">{match.map}</span>
              </div>
            </div>
          </div>
          <span className={`text-xs font-display font-bold tracking-wider px-2 py-0.5 rounded flex items-center gap-1 shrink-0 ml-2 ${statusCfg.class}`}>
            <StatusIcon size={10} />
            {statusCfg.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground tracking-wider">🥇 1ST</p>
            <p className="text-xs font-bold font-display text-neon-orange">₹{(match.firstPlace || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground tracking-wider">🥈 2ND</p>
            <p className="text-xs font-bold font-display text-foreground">₹{(match.secondPlace || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground tracking-wider">🎯 KILL</p>
            <p className="text-xs font-bold font-display text-neon-cyan">₹{match.perKill}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <Trophy size={12} className="text-neon-orange" />
            <span className="text-xs font-bold text-neon-orange">₹{(match.prizePool || 0).toLocaleString('en-IN')}</span>
            <span className="text-xs text-muted-foreground">pool</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{match.date} {match.time}</span>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Users size={11} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {match.filledSlots || 0}/{match.totalSlots} slots
              </span>
            </div>
            {isFull ? (
              <span className="text-xs text-red-400 font-semibold">FULL</span>
            ) : (
              <span className="text-xs text-neon-green font-semibold">{slotsLeft} left</span>
            )}
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                fillPercent > 90 ? 'bg-red-500' : fillPercent > 70 ? 'bg-neon-orange' : 'bg-neon-cyan'
              }`}
              style={{ width: `${Math.min(fillPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Action Buttons: Room ID & Join button control */}
        <div className="flex items-center gap-2">
          {/* Room ID button visible ONLY to registered/joined players who have room credentials */}
          {isUserJoined && match.roomId && (
            <button
              onClick={() => setShowRoom(!showRoom)}
              className="flex items-center gap-1.5 text-xs btn-neon-cyan rounded-lg px-3 py-2 font-semibold flex-1 shadow-[0_0_10px_rgba(0,255,255,0.2)]"
            >
              {showRoom ? <EyeOff size={12} /> : <Eye size={12} />}
              Room ID
            </button>
          )}

          {/* Join Button - Locked / Registered if joined */}
          {!isCompleted && !isLive && (
            loadingStatus ? (
              <div className="flex-1 rounded-lg py-2 text-xs font-display font-bold text-muted-foreground bg-muted/30 text-center animate-pulse">
                Loading...
              </div>
            ) : (
              <button
                onClick={handleJoin}
                disabled={isUserJoined || isFull || joining}
                className={`flex-1 rounded-lg py-2 text-xs font-display font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all duration-200 ${
                  isUserJoined
                    ? 'bg-neon-green/15 text-neon-green border border-neon-green/40 cursor-default'
                    : isFull
                    ? 'bg-muted/30 text-muted-foreground cursor-not-allowed'
                    : 'btn-solid-cyan'
                }`}
              >
                {joining ? (
                  <div className="w-3 h-3 border border-background/40 border-t-background rounded-full animate-spin" />
                ) : isUserJoined ? (
                  <>✓ REGISTERED</>
                ) : isFull ? (
                  <>FULL</>
                ) : (
                  <>JOIN ₹{match.entryFee}</>
                )}
              </button>
            )
          )}

          {/* If match is Live and player hasn't joined */}
          {isLive && !isUserJoined && (
            <div className="flex-1 rounded-lg py-2 text-xs font-display font-bold text-neon-orange bg-neon-orange/10 border border-neon-orange/30 text-center tracking-wider">
              MATCH STARTED
            </div>
          )}

          {isCompleted && (
            <div className="flex-1 rounded-lg py-2 text-xs font-display font-bold text-muted-foreground bg-muted/20 border border-border text-center">
              MATCH ENDED
            </div>
          )}
        </div>

        {/* Secret Room Credentials Box */}
        {showRoom && isUserJoined && match.roomId && (
          <div className="mt-3 p-3 bg-neon-cyan/5 border border-neon-cyan/30 rounded-lg animate-fade-scale">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Lock size={10} className="text-neon-cyan" />
              Room Credentials — Do not share
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background/60 p-1.5 rounded border border-border">
                <p className="text-[10px] text-muted-foreground tracking-widest">ROOM ID</p>
                <p className="font-display font-bold text-neon-cyan text-sm tracking-widest">{match.roomId}</p>
              </div>
              <div className="bg-background/60 p-1.5 rounded border border-border">
                <p className="text-[10px] text-muted-foreground tracking-widest">PASSWORD</p>
                <p className="font-display font-bold text-neon-orange text-sm tracking-widest">{match.roomPassword || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {slotsLeft <= 5 && slotsLeft > 0 && !isCompleted && !isLive && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-neon-orange">
            <AlertTriangle size={11} />
            Only {slotsLeft} slot{slotsLeft > 1 ? 's' : ''} remaining!
          </div>
        )}

        {/* View Details & Click Join Players button */}
        {(!isLive || isUserJoined) ? (
          <button
            onClick={() => setModalOpen(true)}
            className="mt-3 w-full py-2 rounded-lg text-xs font-display font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'rgba(0,255,255,0.06)',
              border: '1px solid rgba(0,255,255,0.18)',
              color: '#00ffff',
            }}
          >
            <Users size={12} />
            VIEW DETAILS &amp; CLICK JOIN PLAYERS
            <ChevronRight size={12} />
          </button>
        ) : (
          <div className="mt-3 w-full py-2 rounded-lg text-xs font-display font-bold tracking-wider flex items-center justify-center gap-1.5 text-muted-foreground bg-muted/20 border border-border cursor-not-allowed">
            <ShieldAlert size={12} />
            LOCKED (JOINED PLAYERS ONLY)
          </div>
        )}
      </div>

      {modalOpen && (
        <MatchDetailModal match={match} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}

export default function MatchGrid({ activeFilter }: { activeFilter: string }) {
  const [allMatches, setAllMatches] = useState<Match[]>([]);

  useEffect(() => {
    const loadAndCheckMatches = () => {
      const saved = localStorage.getItem('firearena_matches');
      if (saved) {
        try {
          const parsedMatches: Match[] = JSON.parse(saved);
          
          const now = new Date();
          let updated = false;

          const checkedMatches = parsedMatches.map((m) => {
            if (m.status !== 'Completed' && m.status !== 'Live' && m.date && m.time) {
              const formattedDateTimeStr = `${m.date.trim()}T${m.time.trim()}`;
              const matchDateTime = new Date(formattedDateTimeStr);

              if (!isNaN(matchDateTime.getTime()) && now >= matchDateTime) {
                updated = true;
                return { ...m, status: 'Live' as MatchStatus };
              }
            }
            return m;
          });

          if (updated) {
            localStorage.setItem('firearena_matches', JSON.stringify(checkedMatches));
          }

          setAllMatches(checkedMatches);
        } catch (e) {
          console.error('Failed to parse localStorage matches', e);
        }
      }
    };

    loadAndCheckMatches();
    const interval = setInterval(loadAndCheckMatches, 30000);

    window.addEventListener('storage', loadAndCheckMatches);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadAndCheckMatches);
    };
  }, []);

  const filtered = allMatches.filter((m) => {
    if (activeFilter === 'All') return true;
    return m.mode === activeFilter || m.status === activeFilter;
  });

  if (filtered.length === 0) {
    return (
      <div className="card-surface rounded-xl p-12 text-center border border-border">
        <Swords size={40} className="text-muted-foreground mx-auto mb-3" />
        <p className="font-display font-bold text-lg text-foreground tracking-wider">No Matches Found</p>
        <p className="text-sm text-muted-foreground mt-1">
          No matches available right now. Create a new match from the Admin Panel!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
      {filtered.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}