'use client';

import React, { useState } from 'react';
import { Image, Video, X, Upload, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

// ─── Supabase Client Initialization ──────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
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

interface MediaUploaderProps {
  onUploadSuccess?: (url: string, type: 'image' | 'video', caption: string) => void;
}

export default function MediaUploader({ onUploadSuccess }: MediaUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  // File select karne par preview generate karna
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Size check (Max 50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error('File size should be less than 50MB');
      return;
    }

    // Flexible detection for videos and images
    const isVideo = selectedFile.type.includes('video') || selectedFile.name.match(/\.(mp4|mov|mkv|webm|avi|flv)$/i);
    const finalType = isVideo ? 'video' : 'image';

    setFile(selectedFile);
    setFileType(finalType);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  // Clear selection
  const handleClear = () => {
    setFile(null);
    setPreviewUrl(null);
    setFileType(null);
    setCaption('');
  };

  // Real Supabase Storage Upload & Database Insert Handler
  const handleUpload = async () => {
    if (!file || !fileType) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      // 1. Get Logged-in User Info
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      let userName = 'Soldier';
      let userAvatar = '🎯';

      if (authUser?.user_metadata) {
        userName = authUser.user_metadata.player_name || authUser.user_metadata.name || 'Soldier';
        const avKey = authUser.user_metadata.avatar || 'av-1';
        userAvatar = AVATAR_MAP[avKey] || (avKey.length <= 2 ? avKey : '🎯');
      } else {
        const storedUser = localStorage.getItem('firearena_user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            userName = parsed.player_name || parsed.name || 'Soldier';
            const avKey = parsed.avatar || 'av-1';
            userAvatar = AVATAR_MAP[avKey] || (avKey.length <= 2 ? avKey : '🎯');
          } catch (e) {
            console.error('Error parsing local user', e);
          }
        }
      }

      // 2. Upload file to Supabase Storage Bucket ('shorts_bucket')
      const fileExt = file.name.split('.').pop() || (fileType === 'video' ? 'mp4' : 'jpg');
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('shorts_bucket')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage Upload Error:', uploadError);
        throw new Error(uploadError.message || 'Failed to upload file to storage');
      }

      // 3. Get Public URL of the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('shorts_bucket')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      // 4. Save record in `shorts_media` table so it appears in Watch Shorts
      const { error: dbError } = await supabase.from('shorts_media').insert([
        {
          user_name: userName,
          user_avatar: userAvatar,
          media_url: publicUrl,
          media_type: fileType,
          caption: caption || 'Free Fire Highlight 🔥',
          likes: 0
        }
      ]);

      if (dbError) {
        console.error('Database Insert Error:', dbError);
        throw new Error(dbError.message || 'Failed to save post data in database');
      }

      if (onUploadSuccess && publicUrl && fileType) {
        onUploadSuccess(publicUrl, fileType, caption);
      }

      toast.success('Posted & Uploaded successfully! 🎉');
      setUploading(false);
      handleClear();

    } catch (err: any) {
      console.error('Upload process error:', err);
      toast.error(err.message || 'Upload failed!');
      setUploading(false);
    }
  };

  return (
    <div 
      className="w-full max-w-lg mx-auto rounded-2xl border border-border p-4 shadow-xl"
      style={{ background: 'var(--surface-2)', backdropFilter: 'blur(10px)' }}
    >
      <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Upload className="w-5 h-5 text-neon-cyan" />
          Create New Reel / Post
        </h3>
      </div>

      {!previewUrl ? (
        <label 
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-neon-cyan transition-all group"
          style={{ background: 'var(--surface-3)' }}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
            <div className="flex gap-3 mb-3">
              <div className="p-3 rounded-full bg-neon-cyan/10 text-neon-cyan group-hover:scale-110 transition-transform">
                <Image className="w-6 h-6" />
              </div>
              <div className="p-3 rounded-full bg-neon-green/10 text-neon-green group-hover:scale-110 transition-transform">
                <Video className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm text-foreground font-medium mb-1">Click to upload photo or reel video</p>
            <p className="text-xs text-muted-foreground">All formats supported (Max 50MB)</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*,video/*,.*" 
            onChange={handleFileChange} 
          />
        </label>
      ) : (
        <div className="space-y-4">
          <div className="relative w-full h-64 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-border">
            <button 
              onClick={handleClear}
              className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {fileType === 'video' ? (
              <video 
                src={previewUrl} 
                controls 
                playsInline 
                preload="auto" 
                className="w-full h-full object-contain" 
              />
            ) : (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            )}
          </div>

          <div>
            <textarea
              placeholder="Write a caption or description..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="input-gaming w-full p-3 text-sm rounded-xl resize-none text-foreground bg-card border border-border"
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,255,136,0.1))',
              border: '1px solid rgba(0,212,255,0.4)',
              color: 'var(--neon-cyan)',
            }}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading to Supabase...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Share Post / Reel
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}