'use client';
import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import MatchFilters from './MatchFilters';
import MatchGrid from './MatchGrid';
import WalletWidget from './WalletWidget';
import LeaderboardPanel from './LeaderboardPanel';
import WalletTopupModal from './WalletModal';
import MediaUploader from '@/components/MediaUploader';
import { MessageCircle } from 'lucide-react';

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

// ─── WhatsApp Support Floating Button Component ─────────────────────────────
function WhatsAppSupport() {
  return (
    <a
      href="https://wa.me/917260069533?text=Hello%20Support,%20I%20need%20help%20with%20my%20FireArena%20account."
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: 'fixed',
        bottom: '25px',
        right: '25px',
        backgroundColor: '#25D366',
        color: '#FFFFFF',
        borderRadius: '50%',
        width: '60px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)',
        zIndex: 9999,
        cursor: 'pointer',
        transition: 'transform 0.3s ease',
      }}
      title="Chat with WhatsApp Support"
    >
      <MessageCircle size={32} />
    </a>
  );
}

export default function MatchDashboardContent() {
  const [activeFilter, setActiveFilter] = useState<'All' | MatchMode | MatchStatus>('All');
  const [walletOpen, setWalletOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  // Modal States
  const [isReelsOpen, setIsReelsOpen] = useState(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  
  // Selected Profile Modal State
  const [selectedProfileUser, setSelectedProfileUser] = useState<any | null>(null);

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

  // Fetch Logged-in User Data & Sync Matches
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

      // Background Automatic Likes Booster check
      try {
        const { data: mediaList } = await supabase.from('shorts_media').select('id, likes, created_at');
        if (mediaList) {
          mediaList.forEach(async (item) => {
            if ((item.likes || 0) < 600) {
              const createdTime = new Date(item.created_at || Date.now()).getTime();
              const diffMinutes = (Date.now() - createdTime) / (1000 * 60);
              if (diffMinutes >= 2) {
                const boostedLikes = Math.floor(Math.random() * 75) + 600; 
                await supabase.from('shorts_media').update({ likes: boostedLikes }).eq('id', item.id);
              }
            }
          });
        }
      } catch (err) {
        console.error('Error auto-boosting likes:', err);
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
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('firearena_user');
    window.location.href = '/'; 
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-16 py-4 sm:py-6 pb-20 sm:pb-6 relative">
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="space-y-3">
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
              <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl py-3 px-4 z-50 space-y-3">
                <div className="border-b border-border pb-3">
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="text-xs sm:text-sm font-bold text-foreground truncate">{user.email}</p>
                  <div className="mt-2 text-xs bg-muted/60 rounded-lg p-2 space-y-1">
                    <p className="text-foreground"><span className="text-muted-foreground">Name:</span> {user.name}</p>
                    <p className="text-foreground"><span className="text-muted-foreground">UID:</span> {user.uid}</p>
                  </div>
                </div>

                <div className="border-b border-border pb-3 space-y-1.5">
                  <button 
                    onClick={() => { 
                      setSelectedProfileUser({ 
                        user_name: user.name, 
                        user_uid: user.uid, 
                        user_avatar: user.avatar,
                        followers_count: 670,
                        following_count: 0
                      }); 
                      setProfileDropdownOpen(false); 
                    }}
                    className="w-full text-left bg-transparent hover:bg-yellow-500/10 text-yellow-400 rounded-lg py-2 px-2 text-xs font-bold tracking-wide transition flex items-center gap-2 cursor-pointer"
                  >
                    👤 My Profile
                  </button>
                  <button 
                    onClick={() => { setIsReelsOpen(true); setProfileDropdownOpen(false); }}
                    className="w-full text-left bg-transparent hover:bg-cyan-500/10 text-cyan-400 rounded-lg py-2 px-2 text-xs font-bold tracking-wide transition flex items-center gap-2 cursor-pointer"
                  >
                    📱 Watch Shorts
                  </button>
                  <button 
                    onClick={() => { setIsUploaderOpen(true); setProfileDropdownOpen(false); }}
                    className="w-full text-left bg-transparent hover:bg-green-500/10 text-green-400 rounded-lg py-2 px-2 text-xs font-bold tracking-wide transition flex items-center gap-2 cursor-pointer"
                  >
                    🎥 Upload Video
                  </button>
                  <button 
                    onClick={() => { setIsUploaderOpen(true); setProfileDropdownOpen(false); }}
                    className="w-full text-left bg-transparent hover:bg-blue-500/10 text-blue-400 rounded-lg py-2 px-2 text-xs font-bold tracking-wide transition flex items-center gap-2 cursor-pointer"
                  >
                    📸 Upload Photo
                  </button>
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
        <div className="xl:col-span-3 space-y-5 overflow-x-hidden">
          <MatchFilters activeFilter={activeFilter} onFilter={setActiveFilter} />
          <MatchGrid activeFilter={activeFilter} />
        </div>

        <div className="xl:col-span-1 space-y-5">
          <WalletWidget onAddFunds={() => setWalletOpen(true)} />
          <LeaderboardPanel />
        </div>
      </div>

      {walletOpen && <WalletTopupModal onClose={() => setWalletOpen(false)} />}

      {/* UPLOADER MODAL */}
      {isUploaderOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl relative p-1 overflow-hidden">
            <button 
              onClick={() => setIsUploaderOpen(false)}
              className="absolute top-3 right-3 z-50 bg-black/50 hover:bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
            >
              ✕
            </button>
            <div className="pt-8 pb-2 px-2">
              <MediaUploader />
            </div>
          </div>
        </div>
      )}

      {/* WATCH SHORTS MODAL */}
      {isReelsOpen && (
        <DynamicReelsModal 
          currentUser={user}
          onClose={() => setIsReelsOpen(false)} 
          onOpenProfile={(playerData: any) => setSelectedProfileUser(playerData)} 
        />
      )}

      {/* PROFILE MODAL */}
      {selectedProfileUser && (
        <InstagramProfileModal 
          player={selectedProfileUser} 
          currentUser={user}
          onClose={() => setSelectedProfileUser(null)} 
        />
      )}

      {/* WhatsApp Support Floating Widget */}
      <WhatsAppSupport />

    </div>
  );
}

// ─── Dynamic Reels Modal Component ──────────────────────────────────────────
function DynamicReelsModal({ currentUser, onClose, onOpenProfile }: { currentUser: UserProfile; onClose: () => void; onOpenProfile: (player: any) => void }) {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReels = async () => {
    const { data, error } = await supabase
      .from('shorts_media')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReels(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReels();
  }, []);

  return (
    <div className="fixed inset-0 z-[150] bg-black flex items-center justify-center">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[160] text-white bg-white/20 hover:bg-white/40 p-3 rounded-full backdrop-blur-md transition cursor-pointer"
      >
        ✕
      </button>
      
      <div className="w-full max-w-md h-[100dvh] overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative bg-zinc-900 border-x border-zinc-800">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-white text-sm">
            Loading Shorts & Photos... 🚀
          </div>
        ) : reels.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/60 space-y-2 p-6 text-center">
            <span className="text-4xl">📭</span>
            <p className="text-sm">Abhi tak koi photo ya video upload nahi ki gayi hai!</p>
          </div>
        ) : (
          reels.map((item) => (
            <ReelCard 
              key={item.id} 
              item={item} 
              currentUser={currentUser}
              onOpenProfile={onOpenProfile} 
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Individual Reel Card Component ───
function ReelCard({ item, currentUser, onOpenProfile }: { item: any; currentUser: UserProfile; onOpenProfile: (player: any) => void }) {
  const [likes, setLikes] = useState(item.likes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(item.followers_count || 670);
  const followingCount = item.following_count || 0;

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const isOwner = currentUser.name.trim().toLowerCase() === (item.user_name || '').trim().toLowerCase();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (videoRef.current) {
            if (entry.isIntersecting) {
              videoRef.current.play().catch(() => {});
              setIsPlaying(true);
            } else {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => { if (cardRef.current) observer.unobserve(cardRef.current); };
  }, []);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) { videoRef.current.pause(); setIsPlaying(false); }
      else { videoRef.current.play().catch(() => {}); setIsPlaying(true); }
    }
  };

  const handleLike = async () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    const updatedLikes = newLikedState ? likes + 1 : likes - 1;
    setLikes(updatedLikes);

    await supabase.from('shorts_media').update({ likes: updatedLikes }).eq('id', item.id);
  };

  const handleFollowToggle = () => {
    const newFollowState = !isFollowing;
    setIsFollowing(newFollowState);
    setFollowersCount(newFollowState ? followersCount + 1 : followersCount - 1);
    
    if (newFollowState) {
      toast.success(`You are now following ${item.user_name || 'Soldier'}! 🤝`);
    } else {
      toast.info(`Unfollowed ${item.user_name || 'Soldier'}`);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(item.media_url);
    toast.success('Media link copied to clipboard! 🔗');
  };

  return (
    <div ref={cardRef} className="w-full h-full snap-start relative flex items-center justify-center bg-black">
      {item.media_type === 'video' ? (
        <video 
          ref={videoRef}
          src={item.media_url} 
          className="w-full h-full object-cover cursor-pointer" 
          onClick={togglePlayPause}
          controls 
          playsInline 
          preload="auto"
        />
      ) : (
        <img 
          src={item.media_url} 
          alt="Uploaded Post" 
          className="w-full h-full object-contain bg-zinc-950" 
        />
      )}

      {/* Overlay Details */}
      <div className="absolute bottom-6 left-4 right-16 text-white space-y-2 z-10 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div 
            onClick={() => onOpenProfile(item)}
            className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 cursor-pointer hover:scale-105 transition shadow-md"
            title="Click to View Profile"
          >
            <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-lg">
              {item.user_avatar || '🎯'}
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <span 
                onClick={() => onOpenProfile(item)}
                className="font-bold text-sm tracking-wide cursor-pointer hover:underline text-white flex items-center gap-1"
              >
                {item.user_name || 'toxi_indian2'} 
                <span className="text-cyan-400 text-xs">✔</span>
              </span>
              {!isOwner && (
                <button
                  onClick={handleFollowToggle}
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition cursor-pointer ${
                    isFollowing ? 'bg-zinc-800 text-zinc-300 border-zinc-600' : 'bg-cyan-500 text-black border-cyan-400 hover:bg-cyan-400'
                  }`}
                >
                  {isFollowing ? 'Following ✓' : '+ Follow'}
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-[11px] text-zinc-300 mt-0.5 font-medium">
              <span><strong className="text-white">{followersCount}</strong> followers</span>
              <span>•</span>
              <span><strong className="text-white">{followingCount}</strong> following</span>
            </div>
          </div>
        </div>

        <p className="text-xs line-clamp-2 bg-black/50 backdrop-blur-sm p-2 rounded-lg border border-white/10">
          {item.caption || '🎮 Join Our Free Fire Tournament 🔥'}
        </p>
      </div>

      {/* Actions */}
      <div className="absolute bottom-6 right-4 flex flex-col items-center gap-5 text-white z-10">
        <button onClick={handleLike} className="flex flex-col items-center gap-1 transition cursor-pointer group">
          <span className={`text-2xl transition transform group-active:scale-125 ${isLiked ? 'text-red-500 scale-110' : 'hover:text-red-400'}`}>
            {isLiked ? '❤️' : '🤍'}
          </span>
          <span className="text-xs font-semibold">{likes}</span>
        </button>

        <button onClick={handleShare} className="flex flex-col items-center gap-1 hover:text-blue-400 transition cursor-pointer">
          <span className="text-2xl">↪️</span>
          <span className="text-xs font-semibold">Share</span>
        </button>
      </div>
    </div>
  );
}

// ─── PROFILE MODAL ──────────────────────────────────────────────────────────
function InstagramProfileModal({ player, currentUser, onClose }: { player: any; currentUser: UserProfile; onClose: () => void }) {
  const [userReels, setUserReels] = useState<any[]>([]);
  const [userMatchesPlayed, setUserMatchesPlayed] = useState(0);
  const [followersCount, setFollowersCount] = useState(player.followers_count || 670);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Selected Post for Full Screen View
  const [activePost, setActivePost] = useState<any | null>(null);

  // Editable Bio & WhatsApp Link state
  const [isEditing, setIsEditing] = useState(false);
  const [bioText, setBioText] = useState(
    '🎮 Join Our Free Fire Tournament\n🚫 Haker in game ⚠️ 100% refund ♻️\n📥 Guild promotion'
  );
  const [whatsappLink, setWhatsappLink] = useState('https://chat.whatsapp.com/KjutvTEvSGFPeQAPsBy7s');
  const [customAvatar, setCustomAvatar] = useState(player.user_avatar || '🎯');

  const isProfileOwner = currentUser.name.trim().toLowerCase() === (player.user_name || '').trim().toLowerCase();

  useEffect(() => {
    const fetchProfileDetails = async () => {
      const playerName = player.user_name || 'toxi_indian2';

      const { data: reelsData } = await supabase
        .from('shorts_media')
        .select('*')
        .eq('user_name', playerName)
        .order('created_at', { ascending: false });

      if (reelsData) {
        setUserReels(reelsData);
      }

      const { count: matchesCount } = await supabase
        .from('match_participants')
        .select('*', { count: 'exact', head: true })
        .eq('player_name', playerName);

      setUserMatchesPlayed(matchesCount !== null ? matchesCount : 4);
      setLoading(false);
    };

    fetchProfileDetails();
  }, [player]);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    setFollowersCount(isFollowing ? followersCount - 1 : followersCount + 1);
    toast.success(isFollowing ? 'Unfollowed successfully' : `Started following ${player.user_name || 'toxi_indian2'}! 🤝`);
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
    toast.success('Bio and WhatsApp link updated successfully! ✨');
  };

  const handleChangeAvatar = () => {
    const emojis = ['🎯', '⚔️', '🔥', '💀', '🦅', '⚡', '🐉', '🌙', '👑', '💎'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    setCustomAvatar(randomEmoji);
    toast.success('Profile avatar updated! 🖼️');
  };

  const handleDeleteFromProfile = async (postId: string) => {
    if (!window.confirm('Kya aap sach mein is post ko delete karna chahte hain?')) return;

    const { error } = await supabase.from('shorts_media').delete().eq('id', postId);
    if (!error) {
      setUserReels((prev) => prev.filter((r) => r.id !== postId));
      setActivePost(null);
      toast.success('Post successfully delete ho gayi aur Watch Shorts se bhi remove ho gayi! 🗑️');
    } else {
      toast.error('Delete karne mein error aayi.');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-none sm:rounded-2xl w-full max-w-md min-h-[100dvh] sm:min-h-0 sm:max-h-[90vh] shadow-2xl relative text-white flex flex-col overflow-y-auto">
        
        {/* Top Navbar Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 sticky top-0 bg-zinc-950/90 backdrop-blur z-20">
          <div className="flex items-center gap-2 font-bold text-sm">
            <span>{player.user_name || 'toxi_indian2'}</span>
            <span className="text-cyan-400 text-xs">✔</span>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-xl w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Profile Main Section */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div 
              onClick={isProfileOwner ? handleChangeAvatar : undefined}
              className={`w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 shadow-md ${isProfileOwner ? 'cursor-pointer group relative' : ''}`}
              title={isProfileOwner ? "Click to change profile picture" : ""}
            >
              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-3xl group-hover:scale-95 transition">
                {customAvatar}
              </div>
              {isProfileOwner && <span className="absolute bottom-0 right-0 bg-cyan-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">📷</span>}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-around flex-1 ml-6 text-center">
              <div>
                <p className="font-bold text-base">{userReels.length}</p>
                <p className="text-xs text-zinc-400">posts</p>
              </div>
              <div>
                <p className="font-bold text-base">{followersCount}</p>
                <p className="text-xs text-zinc-400">followers</p>
              </div>
              <div>
                <p className="font-bold text-base">0</p>
                <p className="text-xs text-zinc-400">following</p>
              </div>
            </div>
          </div>

          {/* Bio & Details */}
          <div className="space-y-2 text-xs">
            <div className="font-bold flex items-center gap-1 text-sm text-white">
              <span>{player.user_name || 'Fire Raushan'}</span>
              <span className="text-cyan-400 text-xs">✔</span>
            </div>

            {isEditing ? (
              <div className="space-y-3 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold block mb-1">Edit Bio:</label>
                  <textarea 
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold block mb-1">Edit WhatsApp / Social Link:</label>
                  <input 
                    type="text"
                    value={whatsappLink}
                    onChange={(e) => setWhatsappLink(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-xs text-cyan-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button 
                  onClick={handleSaveProfile}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-2 rounded-lg text-xs transition cursor-pointer"
                >
                  Save Profile Changes ✓
                </button>
              </div>
            ) : (
              <>
                <p className="text-zinc-300 whitespace-pre-line leading-relaxed">
                  {bioText}
                </p>

                <a 
                  href={whatsappLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-400 font-medium flex items-center gap-1 hover:underline pt-1 inline-block truncate max-w-full"
                >
                  🔗 {whatsappLink}
                </a>
              </>
            )}

            <div className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-green-400 px-3 py-1 rounded-full text-xs font-semibold mt-1">
              <span>⚔️ Total Matches Played:</span>
              <strong className="text-white">{userMatchesPlayed}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {isProfileOwner ? (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-1.5 rounded-lg font-semibold text-xs transition cursor-pointer"
              >
                {isEditing ? 'Cancel Edit' : 'Edit profile'}
              </button>
            ) : (
              <button
                onClick={handleFollow}
                className={`w-full py-1.5 rounded-lg font-semibold text-xs transition cursor-pointer ${
                  isFollowing 
                    ? 'bg-zinc-800 text-white border border-zinc-700' 
                    : 'bg-cyan-500 text-black hover:bg-cyan-400 font-bold'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="flex border-t border-zinc-800 mt-2">
          <div className="flex-1 border-b-2 border-white py-3 flex items-center justify-center text-white text-lg cursor-pointer">
            📱
          </div>
        </div>

        {/* User Uploads Grid */}
        <div className="bg-zinc-950 flex-1 p-0.5">
          {loading ? (
            <div className="text-center py-10 text-xs text-zinc-500">Loading posts...</div>
          ) : userReels.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs space-y-1">
              <p className="text-2xl">📷</p>
              <p>No posts yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {userReels.map((reel) => (
                <div 
                  key={reel.id} 
                  onClick={() => setActivePost(reel)}
                  className="aspect-square bg-zinc-900 relative group overflow-hidden cursor-pointer"
                >
                  {reel.media_type === 'video' ? (
                    <video src={reel.media_url} className="w-full h-full object-cover pointer-events-none" />
                  ) : (
                    <img src={reel.media_url} alt="Post" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                    ❤️ {reel.likes || 0}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* FULL SCREEN POST VIEW MODAL */}
      {activePost && (
        <div className="fixed inset-0 z-[250] bg-black/95 flex items-center justify-center p-4">
          <button 
            onClick={() => setActivePost(null)}
            className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/40 w-10 h-10 rounded-full flex items-center justify-center text-lg z-30 cursor-pointer"
          >
            ✕
          </button>
          
          <div className="w-full max-w-sm bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative flex flex-col max-h-[85vh]">
            <div className="p-3 flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-base">
                  {activePost.user_avatar || '🎯'}
                </div>
                <span className="text-xs font-bold text-white">{activePost.user_name || 'toxi_indian2'}</span>
              </div>

              {isProfileOwner && (
                <button
                  onClick={() => handleDeleteFromProfile(activePost.id)}
                  className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <span>🗑️</span> Delete Post
                </button>
              )}
            </div>

            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
              {activePost.media_type === 'video' ? (
                <video src={activePost.media_url} controls autoPlay className="w-full max-h-[50vh] object-contain" />
              ) : (
                <img src={activePost.media_url} alt="Enlarged Post" className="w-full max-h-[50vh] object-contain" />
              )}
            </div>

            <div className="p-3 bg-zinc-900 border-t border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-white text-sm">
                <span className="font-bold">❤️ {activePost.likes || 0} Likes</span>
                <span className="text-[10px] text-zinc-400">Auto-boosted</span>
              </div>
              <p className="text-xs text-zinc-300">{activePost.caption || 'Tournament Poster 🔥'}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}