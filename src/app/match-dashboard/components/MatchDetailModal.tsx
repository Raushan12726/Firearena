'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useWallet } from './WalletContext';

interface MatchDetailModalProps {
  match: any;
  onClose: () => void;
  initialTab?: 'info' | 'players';
}

export default function MatchDetailModal({ match, onClose, initialTab = 'info' }: MatchDetailModalProps) {
  const { balance, fetchWalletBalance } = useWallet() as any; 
  const walletBalance = balance || 0; 

  const [activeTab, setActiveTab] = useState<'info' | 'players'>(initialTab);
  const [registeredPlayers, setRegisteredPlayers] = useState<any[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [playerUID, setPlayerUID] = useState('');
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showRoom, setShowRoom] = useState(false);
  const [currentMatchData, setCurrentMatchData] = useState<any>(match);

  const entryFee = Number(match?.entry_fee || match?.entryFee) || 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  const checkAlreadyJoined = async (participantsData: any[]) => {
    const savedUID = localStorage.getItem(`match_${match.id}_uid`) || localStorage.getItem('user_uid');
    const { data: { user } } = await supabase.auth.getUser();
    const loggedInUserId = user?.id || localStorage.getItem('user_id') || localStorage.getItem('userId');

    const alreadyJoined = participantsData.some((p: any) => {
      return (savedUID && p.player_uid === savedUID) || (loggedInUserId && p.user_id === loggedInUserId);
    });

    if (alreadyJoined) {
      setJoined(true);
    }
  };

  useEffect(() => {
    if (!match?.id) return;
    
    const fetchParticipants = async () => {
      const { data, error } = await supabase
        .from('match_participants')
        .select('*')
        .eq('match_id', match.id);

      if (!error && data) {
        setRegisteredPlayers(data);
        checkAlreadyJoined(data);
      }
    };

    fetchParticipants();
  }, [match?.id]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!playerName || !playerUID) return;

    if (walletBalance < entryFee) {
      setErrorMsg(`❌ Insufficient Balance! Match join karne ke liye ₹${entryFee} chahiye, aapke wallet mein sirf ₹${walletBalance} hain.`);
      return;
    }

    if (joined) {
      setErrorMsg(`❌ Aap is tournament mein pehle hi register ho chuke hain.`);
      return;
    }

    setJoining(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const loggedInUserId = user?.id || localStorage.getItem('user_id') || localStorage.getItem('userId');

      if (!loggedInUserId) {
        throw new Error("User session nahi mila. Kripya dobara login karein.");
      }

      const { data: existingCheck } = await supabase
        .from('match_participants')
        .select('*')
        .eq('match_id', match.id)
        .or(`player_uid.eq.${playerUID},user_id.eq.${loggedInUserId}`);

      if (existingCheck && existingCheck.length > 0) {
        setJoined(true);
        throw new Error("Yeh Free Fire UID ya User account pehle hi is match mein registered hai!");
      }

      const newBalance = walletBalance - entryFee;

      let { error: walletError } = await supabase
        .from('profiles') 
        .update({ 
          balance: newBalance,
          wallet_balance: newBalance 
        })
        .eq('id', loggedInUserId);

      if (walletError) {
        const { error: fallbackError } = await supabase
          .from('profiles')
          .update({ 
            balance: newBalance,
            wallet_balance: newBalance 
          })
          .eq('user_id', loggedInUserId);
        
        if (fallbackError) throw new Error(`Paise cut nahi ho paye: ${walletError.message}`);
      }

      const { error: insertError } = await supabase
        .from('match_participants')
        .insert([
          {
            match_id: match.id,
            player_name: playerName,
            player_uid: playerUID,
            fee_deducted: entryFee,
            user_id: loggedInUserId
          }
        ]);

      if (insertError) throw insertError;

      try {
        await supabase
          .from('transactions')
          .insert([
            {
              user_id: loggedInUserId,
              type: 'Match Join',
              amount: -entryFee,
              description: `Joined match: ${match.title || 'Tournament'}`,
              created_at: new Date().toISOString()
            }
          ]);
      } catch (txErr) {
        const existingTx = JSON.parse(localStorage.getItem('firearena_transactions') || '[]');
        localStorage.setItem('firearena_transactions', JSON.stringify([
          {
            type: 'Match Join',
            amount: -entryFee,
            date: new Date().toLocaleString(),
            title: match.title || 'Tournament Entry'
          },
          ...existingTx
        ]));
      }

      localStorage.setItem(`match_${match.id}_uid`, playerUID);
      localStorage.setItem('user_uid', playerUID);

      const currentFilled = Number(match.filled_slots || match.filledSlots || 0) + 1;
      await supabase
        .from('matches')
        .update({ filled_slots: currentFilled })
        .eq('id', match.id);

      if (fetchWalletBalance) {
        fetchWalletBalance();
      }

      setRegisteredPlayers(prev => [...prev, { player_name: playerName, player_uid: playerUID, user_id: loggedInUserId }]);
      setJoined(true);
      setPlayerName('');
      setPlayerUID('');

      window.location.reload();
    } catch (err: any) {
      setErrorMsg(`Error: ${err.message || 'Kuch galat ho gaya, kripya dobara koshish karein.'}`);
    } finally {
      setJoining(false);
    }
  };

  if (!mounted) return null;

  const roomCredentialsAvailable = currentMatchData?.roomId || currentMatchData?.room_id || match?.roomId;
  const displayRoomId = currentMatchData?.roomId || currentMatchData?.room_id || match?.roomId;
  const displayRoomPassword = currentMatchData?.roomPassword || currentMatchData?.room_password || match?.roomPassword;
  const prizePool = currentMatchData?.prize_pool ?? currentMatchData?.prizePool ?? match?.prizePool ?? 0;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl font-sans text-left">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/40">
          <div>
            <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded uppercase">{match.mode}</span>
            <h3 className="text-base font-bold text-white mt-1">{match.title}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-white text-sm bg-neutral-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">✕ Close</button>
        </div>

        {/* Balance Viewer */}
        <div className="bg-neutral-950/80 px-4 py-2 flex justify-between items-center text-xs border-b border-neutral-800/60">
          <span className="text-neutral-400">👛 Your Wallet: <strong className="text-white">₹{walletBalance}</strong></span>
          <span className="text-neutral-400">🎟️ Entry Fee: <strong className="text-orange-400">₹{entryFee}</strong></span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-800 text-xs bg-neutral-950/20">
          <button type="button" onClick={() => setActiveTab('info')} className={`flex-1 py-3 font-bold text-center ${activeTab === 'info' ? 'text-orange-500 border-b-2 border-orange-500 bg-neutral-800/10' : 'text-neutral-400'}`}>Match Info</button>
          <button type="button" onClick={() => setActiveTab('players')} className={`flex-1 py-3 font-bold text-center ${activeTab === 'players' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-neutral-800/10' : 'text-neutral-400'}`}>Players ({registeredPlayers.length})</button>
        </div>

        <div className="p-4 max-h-[50vh] overflow-y-auto">
          {activeTab === 'info' && (
            <div className="space-y-4">
              
              {joined && (
                <div className="p-3 bg-cyan-950/30 border border-cyan-900/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-cyan-400 flex items-center gap-1.5"><Lock size={12} />Room Credentials</p>
                    {roomCredentialsAvailable && (
                      <button type="button" onClick={() => setShowRoom(!showRoom)} className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer">
                        {showRoom ? <EyeOff size={12} /> : <Eye size={12} />} {showRoom ? 'Hide' : 'Reveal'}
                      </button>
                    )}
                  </div>
                  
                  {roomCredentialsAvailable ? (
                    showRoom ? (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-neutral-950 p-2 rounded border border-neutral-800">
                          <p className="text-[10px] text-neutral-500">ROOM ID</p>
                          <p className="font-bold text-cyan-400 text-sm">{displayRoomId}</p>
                        </div>
                        <div className="bg-neutral-950 p-2 rounded border border-neutral-800">
                          <p className="text-[10px] text-neutral-500">PASSWORD</p>
                          <p className="font-bold text-orange-400 text-sm">{displayRoomPassword || 'N/A'}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-400 italic">Click reveal to view Room ID and Password.</p>
                    )
                  ) : (
                    <p className="text-xs text-amber-400/90 font-medium">⏳ Match start hone se 5 min pehle ID password update kar diya jayega.</p>
                  )}
                </div>
              )}

              {/* Map & Prize Pool */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/40">
                  <p className="text-neutral-500 mb-0.5">🗺️ Map</p>
                  <p className="font-bold text-white">{match.map || 'Bermuda'}</p>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/40">
                  <p className="text-neutral-500 mb-0.5">💰 Prize Pool</p>
                  <p className="font-bold text-emerald-400">₹{prizePool}</p>
                </div>
              </div>

              {/* ✨ HIGHLIGHTED NOTICE BOX (Added right below Map & Prize Pool) */}
              <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                  <AlertTriangle size={14} /> Important Notice:
                </div>
                <ul className="space-y-1.5 text-neutral-300 pl-4 list-disc text-[11px]">
                  <li>Agar koi bhi hacker game mein aata hai toh aapka <strong className="text-emerald-400">100% refund balance</strong> hoga.</li>
                  <li>Game level <strong className="text-orange-400">40 se zyada</strong> hona chahiye. Agar level 40 se kam hai aur aap join karte hain, toh paisa refund <strong className="text-red-400">nahin</strong> milega.</li>
                </ul>
              </div>

              {errorMsg && (
                <div className="bg-red-950/40 border border-red-900/60 text-red-400 p-3 rounded-xl text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {!joined && (
                <form onSubmit={handleFormSubmit} className="space-y-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                  <p className="text-xs font-bold text-neutral-300">Enter Details to Join:</p>
                  <input type="text" placeholder="In-Game Name" value={playerName} onChange={e => setPlayerName(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" required />
                  <input type="text" placeholder="Free Fire UID" value={playerUID} onChange={e => setPlayerUID(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500" required />
                  <button type="submit" disabled={joining} className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-2.5 rounded-lg text-xs hover:opacity-90 cursor-pointer">
                    {joining ? 'Processing...' : 'Proceed to Join'}
                  </button>
                </form>
              )}
            </div>
          )}

          {activeTab === 'players' && (
            <div className="space-y-1.5">
              {registeredPlayers.length === 0 ? (
                <p className="text-center py-6 text-xs text-neutral-500">No players joined yet.</p>
              ) : (
                registeredPlayers.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-neutral-950/60 border border-neutral-800/60 p-2.5 rounded-lg text-xs">
                    <span className="font-bold text-neutral-300">{idx + 1}. {p.player_name}</span>
                    <span className="font-mono bg-neutral-900 px-2 py-0.5 rounded text-neutral-400 text-[11px]">ID: {p.player_uid}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}