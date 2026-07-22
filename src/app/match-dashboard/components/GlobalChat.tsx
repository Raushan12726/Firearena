'use client';
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  message: string;
  time: string;
  isMe?: boolean;
  badge?: string;
}

// Backend: WebSocket /ws/chat/global
const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 'msg-001', user: 'ShadowReaper', avatar: '💀', message: 'GGs on the last match! That final zone was insane 🔥', time: '08:12', badge: 'TOP 10' },
  { id: 'msg-002', user: 'StormBreaker07', avatar: '⚡', message: 'Anyone joining the 10PM classic tonight?', time: '08:13' },
  { id: 'msg-003', user: 'NightHunterX', avatar: '🦅', message: 'Bermuda is the best map no cap', time: '08:13' },
  { id: 'msg-004', user: 'BlazeMaster', avatar: '🔥', message: 'Pro Invitational registration is open! ₹8000 prize pool 👀', time: '08:14', badge: 'PRO' },
  { id: 'msg-005', user: 'IronGhost99', avatar: '⚔️', message: 'Need duo partner for tonight\'s match. 200+ kills stats', time: '08:14' },
  { id: 'msg-006', user: 'RocketKing_FF', avatar: '🎯', message: 'Room ID for Clash Kings just dropped! Check your dashboard', time: '08:15', isMe: true },
];

const BADGE_COLORS: Record<string, string> = {
  'TOP 10': 'bg-neon-orange/20 text-neon-orange',
  PRO: 'bg-neon-purple/20 text-neon-purple',
  ADMIN: 'bg-red-500/20 text-red-400',
};

export default function GlobalChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      user: 'RocketKing_FF',
      avatar: '🎯',
      message: input.trim(),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      isMe: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    // Backend: WebSocket send message
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="card-surface rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageCircle size={15} className="text-neon-cyan" />
          <h3 className="font-display font-bold text-sm tracking-wider text-foreground">GLOBAL CHAT</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neon-green pulse-dot" />
          <span className="text-xs text-neon-green">2,847 online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto scrollbar-gaming p-3 space-y-2.5">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
            <span className="text-base shrink-0">{msg.avatar}</span>
            <div className={`flex-1 min-w-0 ${msg.isMe ? 'items-end' : ''} flex flex-col`}>
              <div className={`flex items-center gap-1.5 mb-0.5 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                <span className={`text-xs font-semibold ${msg.isMe ? 'text-neon-cyan' : 'text-foreground'}`}>
                  {msg.user}
                </span>
                {msg.badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${BADGE_COLORS[msg.badge] ?? 'bg-muted text-muted-foreground'}`}>
                    {msg.badge}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">{msg.time}</span>
              </div>
              <div className={`text-xs rounded-xl px-3 py-2 max-w-[85%] ${
                msg.isMe
                  ? 'bg-neon-cyan/15 text-foreground border border-neon-cyan/20 rounded-tr-sm'
                  : 'bg-muted/50 text-foreground rounded-tl-sm'
              }`}>
                {msg.message}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-border flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message..."
          className="input-gaming flex-1 rounded-lg px-3 py-2 text-xs"
          maxLength={200}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-8 h-8 rounded-lg btn-solid-cyan flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}