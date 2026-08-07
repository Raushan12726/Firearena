'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Heart, MessageCircle, Share2, Volume2 } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ShortItem {
  id: string;
  user_name: string;
  user_avatar: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string;
  likes: number;
}

export default function ShortsFeed() {
  const [shorts, setShorts] = useState<ShortItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShorts();
  }, []);

  const fetchShorts = async () => {
    try {
      const { data, error } = await supabase
        .from('shorts_media')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching shorts:', error);
      } else if (data) {
        setShorts(data);
      }
    } catch (err) {
      console.error('Exception fetching shorts:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    divName: return (
      <div className="flex justify-center items-center py-12 text-neon-cyan text-sm">
        Loading Reels & Highlights...
      </div>
    );
  }

  if (shorts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No reels or highlights found yet. Be the first to upload! 🔥
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-md mx-auto">
      {shorts.map((item) => (
        <div
          key={item.id}
          className="card-surface rounded-2xl border border-border overflow-hidden shadow-xl"
          style={{ background: 'var(--surface-2)' }}
        >
          {/* Header / User Info */}
          <div className="flex items-center gap-3 p-3 border-b border-border/50">
            <div className="w-9 h-9 rounded-full bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center text-base">
              {item.user_avatar || '🎯'}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{item.user_name || 'Soldier'}</p>
              <p className="text-xs text-muted-foreground">Free Fire Player</p>
            </div>
          </div>

          {/* Media Player Container */}
          <div className="relative w-full h-[400px] bg-black flex items-center justify-center">
            {item.media_type === 'video' ? (
              <video
                src={item.media_url}
                controls
                playsInline
                preload="auto"
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={item.media_url}
                alt="Post content"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Caption & Actions */}
          <div className="p-3 space-y-2">
            <p className="text-sm text-foreground">{item.caption}</p>
            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-muted-foreground">
              <button className="flex items-center gap-1.5 hover:text-neon-orange transition-colors text-xs font-semibold">
                <Heart size={16} /> {item.likes || 0} Likes
              </button>
              <button className="flex items-center gap-1.5 hover:text-neon-cyan transition-colors text-xs font-semibold">
                <MessageCircle size={16} /> Comments
              </button>
              <button className="flex items-center gap-1.5 hover:text-foreground transition-colors text-xs font-semibold">
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}