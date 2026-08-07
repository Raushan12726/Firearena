'use client';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function InstagramProfileModal({ player, onClose }: { player: any; onClose: () => void }) {
  const [userReels, setUserReels] = useState<any[]>([]);
  const [activePost, setActivePost] = useState<any | null>(null);
  const [userMatchesPlayed, setUserMatchesPlayed] = useState(0);
  const [followersCount, setFollowersCount] = useState(player.followers_count || 670);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Editable Bio & WhatsApp Link
  const [isEditing, setIsEditing] = useState(false);
  const [bioText, setBioText] = useState(
    '🎮 Join Our Free Fire Tournament\n🚫 Haker in game ⚠️ 100% refund ♻️\n📥 Guild promotion'
  );
  const [whatsappLink, setWhatsappLink] = useState('https://chat.whatsapp.com/KjutvTEvSGFPeQAPsBy7s');
  const [customAvatar, setCustomAvatar] = useState(player.user_avatar || '🎯');

  // Video Sound State for Full Screen Post
  const [isModalVideoMuted, setIsModalVideoMuted] = useState(false);

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
    toast.success(isFollowing ? 'Unfollowed successfully' : `Following ${player.user_name || 'toxi_indian2'}! 🤝`);
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

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-none sm:rounded-2xl w-full max-w-md min-h-[100dvh] sm:min-h-0 sm:max-h-[90vh] shadow-2xl relative text-white flex flex-col overflow-y-auto">
        
        {/* Header */}
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

        {/* Profile Info */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div 
              onClick={handleChangeAvatar}
              className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 shadow-md cursor-pointer group relative"
              title="Click to change profile picture"
            >
              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-3xl group-hover:scale-95 transition">
                {customAvatar}
              </div>
              <span className="absolute bottom-0 right-0 bg-cyan-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">📷</span>
            </div>

            <div className="flex items-center justify-around flex-1 ml-6 text-center">
              <div>
                <p className="font-bold text-base">{userReels.length || 0}</p>
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
                <p className="text-zinc-300 whitespace-pre-line leading-relaxed">{bioText}</p>
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
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-1.5 rounded-lg font-semibold text-xs transition cursor-pointer"
            >
              {isEditing ? 'Cancel Edit' : 'Edit profile'}
            </button>
            <button
              onClick={handleFollow}
              className={`flex-1 py-1.5 rounded-lg font-semibold text-xs transition cursor-pointer ${
                isFollowing ? 'bg-zinc-800 text-white border border-zinc-700' : 'bg-cyan-500 text-black hover:bg-cyan-400 font-bold'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>

        {/* Grid Posts Tab */}
        <div className="flex border-t border-zinc-800 mt-2">
          <div className="flex-1 border-b-2 border-white py-3 flex items-center justify-center text-white text-lg cursor-pointer">
            📱
          </div>
        </div>

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
                  onClick={() => {
                    setIsModalVideoMuted(false); // Reset to unmuted when opening
                    setActivePost(reel);
                  }}
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

      {/* Full Screen Post Modal with Audio Controls */}
      {activePost && (
        <div className="fixed inset-0 z-[250] bg-black/95 flex items-center justify-center p-4">
          <button 
            onClick={() => setActivePost(null)}
            className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/40 w-10 h-10 rounded-full flex items-center justify-center text-lg z-30 cursor-pointer"
          >
            ✕
          </button>
          
          <div className="w-full max-w-sm bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative flex flex-col max-h-[85vh]">
            <div className="p-3 flex items-center gap-2 border-b border-zinc-800">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-base">
                {customAvatar}
              </div>
              <span className="text-xs font-bold text-white">{player.user_name || 'toxi_indian2'}</span>
            </div>

            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden relative">
              {activePost.media_type === 'video' ? (
                <>
                  <video 
                    src={activePost.media_url} 
                    controls 
                    autoPlay 
                    playsInline 
                    muted={isModalVideoMuted}
                    className="w-full max-h-[50vh] object-contain" 
                  />
                  <button 
                    onClick={() => {
                      setIsModalVideoMuted(!isModalVideoMuted);
                      toast.info(isModalVideoMuted ? 'Sound Enabled 🔊' : 'Video Muted 🔇');
                    }}
                    className="absolute bottom-4 right-4 bg-black/80 hover:bg-black text-cyan-400 border border-cyan-500/40 px-3 py-1 rounded-full text-xs font-bold z-20 backdrop-blur cursor-pointer shadow-lg"
                  >
                    {isModalVideoMuted ? '🔇 Tap to Unmute' : '🔊 Sound On'}
                  </button>
                </>
              ) : (
                <img src={activePost.media_url} alt="Enlarged Post" className="w-full max-h-[50vh] object-contain" />
              )}
            </div>

            <div className="p-3 bg-zinc-900 border-t border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-white text-sm">
                <span className="font-bold">❤️ {activePost.likes || 0} Likes</span>
              </div>
              <p className="text-xs text-zinc-300">{activePost.caption || 'Tournament Poster 🔥'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}