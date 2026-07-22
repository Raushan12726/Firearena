'use client';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Swords, Zap, Settings, Trophy, Lock, Target, PlayCircle, Trash2, Edit3 } from 'lucide-react';

interface CreateMatchFormData {
  title: string;
  mode: string;
  map: string;
  date: string;
  time: string;
  startTime: string;
  entryFee: number;
  prizePool: number;
  totalSlots: number;
  firstPlace: number;
  secondPlace: number;
  thirdPlace: number;
  perKill: number;
  roomId: string;
  roomPassword: string;
  description: string;
  maxSquadSize: number;
  autoStart: boolean;
}

const MODES = [
  { value: 'Classic', icon: Swords, color: 'text-neon-purple' },
  { value: 'Clash Squad', icon: Zap, color: 'text-neon-orange' },
  { value: 'Custom', icon: Settings, color: 'text-neon-cyan' },
  { value: 'Battle Royale', icon: Target, color: 'text-neon-green' },
];

const MAPS = ['Bermuda', 'Kalahari', 'Purgatory', 'Alpine', 'Nexterra', 'Bermuda Remastered', 'Factory'];

export default function CreateMatchTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState('Classic');
  const [createdMatches, setCreatedMatches] = useState<any[]>([]);

  // Live match ke baad Room ID/Password set/edit karne ke liye state
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [tempRoomId, setTempRoomId] = useState('');
  const [tempRoomPassword, setTempRoomPassword] = useState('');

  // Load existing matches from localStorage on load
  useEffect(() => {
    const saved = localStorage.getItem('firearena_matches');
    if (saved) {
      try {
        setCreatedMatches(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateMatchFormData>({
    defaultValues: {
      mode: 'Classic',
      totalSlots: 50,
      maxSquadSize: 1,
      autoStart: false,
    },
  });

  const onSubmit = async (data: CreateMatchFormData) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    
    const newMatch = {
      id: 'match_' + Date.now(),
      ...data,
      status: 'Registration Open',
      filledSlots: 0,
    };

    const updatedMatches = [newMatch, ...createdMatches];
    setCreatedMatches(updatedMatches);
    localStorage.setItem('firearena_matches', JSON.stringify(updatedMatches));

    setIsLoading(false);
    toast.success(`Match "${data.title}" created successfully! 🎮`);
    reset();
  };

  // Function to Start Match (Set Status to Live)
  const handleStartMatch = (matchId: string) => {
    const updated = createdMatches.map((m) => {
      if (m.id === matchId) {
        return { ...m, status: 'Live' };
      }
      return m;
    });
    setCreatedMatches(updated);
    localStorage.setItem('firearena_matches', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    toast.success('Match is now LIVE and visible on Dashboard! 🚀');
  };

  // Function to Save/Update Room Credentials after Live
  const handleSaveRoomDetails = (matchId: string) => {
    const updated = createdMatches.map((m) => {
      if (m.id === matchId) {
        return {
          ...m,
          roomId: tempRoomId,
          roomPassword: tempRoomPassword,
        };
      }
      return m;
    });
    setCreatedMatches(updated);
    localStorage.setItem('firearena_matches', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    
    setEditingMatchId(null);
    toast.success('Room ID & Password updated successfully! 🔑');
  };

  // Function to Delete Match
  const handleDeleteMatch = (matchId: string) => {
    const updated = createdMatches.filter((m) => m.id !== matchId);
    setCreatedMatches(updated);
    localStorage.setItem('firearena_matches', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    toast.success('Match deleted successfully! 🗑️');
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Main Details */}
          <div className="xl:col-span-2 space-y-5">
            {/* Basic Info Card */}
            <div className="card-surface rounded-xl p-5 border border-border">
              <h3 className="font-display font-bold text-sm tracking-widest text-neon-cyan uppercase mb-4 flex items-center gap-2">
                <Swords size={14} />
                Match Details
              </h3>

              {/* Title */}
              <div className="mb-4">
                <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                  Match Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Midnight Massacre — Solo Classic"
                  className="input-gaming w-full rounded-lg px-4 py-3 text-sm"
                  {...register('title', { required: 'Match title is required', minLength: { value: 5, message: 'Min 5 characters' } })}
                />
                {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
              </div>

              {/* Mode Selection */}
              <div className="mb-4">
                <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">
                  Match Mode *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MODES.map((m) => {
                    const IconComponent = m.icon;
                    const isSelected = selectedMode === m.value;
                    return (
                      <button
                        key={`mode-${m.value}`}
                        type="button"
                        onClick={() => {
                          setSelectedMode(m.value);
                          setValue('mode', m.value);
                        }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 ${
                          isSelected
                            ? 'bg-neon-cyan/10 border-neon-cyan/50 shadow-[0_0_12px_rgba(0,212,255,0.15)]'
                            : 'border-border hover:border-neon-cyan/30 bg-muted/20'
                        }`}
                      >
                        <IconComponent size={20} className={isSelected ? 'text-neon-cyan' : m.color} />
                        <span className={`text-xs font-display font-bold tracking-wider ${isSelected ? 'text-neon-cyan' : 'text-muted-foreground'}`}>
                          {m.value}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Map + Slots */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                    Map *
                  </label>
                  <select
                    className="input-gaming w-full rounded-lg px-4 py-3 text-sm"
                    {...register('map', { required: 'Map is required' })}
                  >
                    <option value="">Select Map</option>
                    {MAPS.map((map) => (
                      <option key={`map-${map}`} value={map}>{map}</option>
                    ))}
                  </select>
                  {errors.map && <p className="text-red-400 text-xs mt-1">{errors.map.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                    Total Slots *
                  </label>
                  <input
                    type="number"
                    placeholder="50"
                    className="input-gaming w-full rounded-lg px-4 py-3 text-sm"
                    {...register('totalSlots', {
                      required: 'Required',
                      min: { value: 0, message: 'Min 0' },
                      max: { value: 100, message: 'Max 100' },
                    })}
                  />
                  {errors.totalSlots && <p className="text-red-400 text-xs mt-1">{errors.totalSlots.message}</p>}
                </div>
              </div>

              {/* Date + Match Time + Start Match Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                    Match Date *
                  </label>
                  <input
                    type="date"
                    className="input-gaming w-full rounded-lg px-4 py-3 text-sm text-foreground bg-background"
                    {...register('date', { required: 'Date is required' })}
                  />
                  {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                    Match Time *
                  </label>
                  <input
                    type="time"
                    className="input-gaming w-full rounded-lg px-4 py-3 text-sm text-foreground bg-background"
                    {...register('time', { required: 'Match time is required' })}
                  />
                  {errors.time && <p className="text-red-400 text-xs mt-1">{errors.time.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-widest text-neon-orange uppercase mb-1.5">
                    Start Match Time *
                  </label>
                  <input
                    type="time"
                    className="input-gaming w-full rounded-lg px-4 py-3 text-sm text-foreground bg-background border-neon-orange/40 focus:border-neon-orange"
                    {...register('startTime', { required: 'Start match time is required' })}
                  />
                  {errors.startTime && <p className="text-red-400 text-xs mt-1">{errors.startTime.message}</p>}
                </div>
              </div>
            </div>

            {/* Prize Distribution */}
            <div className="card-surface rounded-xl p-5 border border-border">
              <h3 className="font-display font-bold text-sm tracking-widest text-neon-orange uppercase mb-4 flex items-center gap-2">
                <Trophy size={14} />
                Prize Distribution
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                    Entry Fee (₹) *
                  </label>
                  <input
                    type="number"
                    placeholder="30"
                    className="input-gaming w-full rounded-lg px-4 py-3 text-sm"
                    {...register('entryFee', {
                      required: 'Entry fee required',
                      min: { value: 0, message: 'Cannot be negative' },
                    })}
                  />
                  {errors.entryFee && <p className="text-red-400 text-xs mt-1">{errors.entryFee.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                    Total Prize Pool (₹) *
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    className="input-gaming w-full rounded-lg px-4 py-3 text-sm"
                    {...register('prizePool', {
                      required: 'Prize pool required',
                      min: { value: 0, message: 'Min ₹0' },
                    })}
                  />
                  {errors.prizePool && <p className="text-red-400 text-xs mt-1">{errors.prizePool.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                    🥇 1st Place (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="700"
                    className="input-gaming w-full rounded-lg px-4 py-3 text-sm"
                    {...register('firstPlace', { required: 'Required', min: { value: 0, message: 'Invalid' } })}
                  />
                  {errors.firstPlace && <p className="text-red-400 text-xs mt-1">{errors.firstPlace.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                    🥈 2nd Place (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="400"
                    className="input-gaming w-full rounded-lg px-4 py-3 text-sm"
                    {...register('secondPlace', { required: 'Required', min: { value: 0, message: 'Invalid' } })}
                  />
                  {errors.secondPlace && <p className="text-red-400 text-xs mt-1">{errors.secondPlace.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                    🥉 3rd Place (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="200"
                    className="input-gaming w-full rounded-lg px-4 py-3 text-sm"
                    {...register('thirdPlace', { required: 'Required', min: { value: 0, message: 'Invalid' } })}
                  />
                  {errors.thirdPlace && <p className="text-red-400 text-xs mt-1">{errors.thirdPlace.message}</p>}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                  🎯 Per Kill Bonus (₹)
                </label>
                <input
                  type="number"
                  placeholder="10"
                  className="input-gaming w-full rounded-lg px-4 py-3 text-sm"
                  {...register('perKill', { required: 'Required', min: { value: 0, message: 'Invalid' } })}
                />
                {errors.perKill && <p className="text-red-400 text-xs mt-1">{errors.perKill.message}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="card-surface rounded-xl p-5 border border-border">
              <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                Match Description (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Rules, special conditions, squad requirements..."
                className="input-gaming w-full rounded-lg px-4 py-3 text-sm resize-none"
                {...register('description')}
              />
            </div>
          </div>

          {/* Right: Room Credentials + Settings */}
          <div className="space-y-5">
            {/* Room Credentials */}
            <div className="card-surface rounded-xl p-5 border border-border">
              <h3 className="font-display font-bold text-sm tracking-widest text-neon-green uppercase mb-4 flex items-center gap-2">
                <Lock size={14} />
                Room Credentials
              </h3>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                These will be revealed to registered players before match start.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                    Room ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FF2026ARENA"
                    className="input-gaming w-full rounded-lg px-4 py-3 text-sm font-mono tracking-widest"
                    {...register('roomId')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                    Room Password
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ARENA88"
                    className="input-gaming w-full rounded-lg px-4 py-3 text-sm font-mono tracking-widest"
                    {...register('roomPassword')}
                  />
                </div>
              </div>
            </div>

            {/* Match Settings */}
            <div className="card-surface rounded-xl p-5 border border-border">
              <h3 className="font-display font-bold text-sm tracking-widest text-neon-purple uppercase mb-4 flex items-center gap-2">
                <Settings size={14}/>
                Match Settings
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
                    Max Squad Size
                  </label>
                  <select
                    className="input-gaming w-full rounded-lg px-4 py-3 text-sm"
                    {...register('maxSquadSize')}
                  >
                    <option value={1}>Solo (1)</option>
                    <option value={2}>Duo (2)</option>
                    <option value={4}>Squad (4)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-solid-orange w-full rounded-xl py-3.5 font-display font-bold tracking-widest text-sm uppercase flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating Match...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Create Match
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Manage / Start Created Matches Section */}
      {createdMatches.length > 0 && (
        <div className="card-surface rounded-xl p-6 border border-border mt-8">
          <h3 className="font-display font-bold text-base tracking-wider text-neon-green uppercase mb-4 flex items-center gap-2">
            <PlayCircle size={18} />
            Manage & Start Created Matches
          </h3>
          <div className="space-y-4">
            {createdMatches.map((match) => (
              <div key={match.id} className="bg-muted/20 border border-border rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-foreground truncate">{match.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {match.mode} • Map: {match.map} • Time: {match.time} • Status: <span className="text-neon-cyan font-bold">{match.status}</span>
                    </p>
                    {match.roomId && (
                      <p className="text-xs text-neon-green mt-1 font-mono">
                        🔑 Room ID: {match.roomId} | Pass: {match.roomPassword || 'N/A'}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Edit Room ID Button */}
                    <button
                      onClick={() => {
                        setEditingMatchId(editingMatchId === match.id ? null : match.id);
                        setTempRoomId(match.roomId || '');
                        setTempRoomPassword(match.roomPassword || '');
                      }}
                      className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/40 px-3 py-2 rounded-lg text-xs font-bold tracking-wider transition flex items-center gap-1.5"
                    >
                      <Edit3 size={14} /> {editingMatchId === match.id ? 'Close ID Box' : '🔑 Set/Edit Room ID'}
                    </button>

                    {match.status !== 'Live' ? (
                      <button
                        onClick={() => handleStartMatch(match.id)}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/40 px-3 py-2 rounded-lg text-xs font-bold tracking-wider transition flex items-center gap-1.5"
                      >
                        <PlayCircle size={14} /> Start (Live)
                      </button>
                    ) : (
                      <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse">
                        🔴 LIVE
                      </span>
                    )}

                    {/* Delete Match Button */}
                    <button
                      onClick={() => handleDeleteMatch(match.id)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 p-2 rounded-lg text-xs transition flex items-center justify-center"
                      title="Delete Match"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Inline Room ID Edit Panel */}
                {editingMatchId === match.id && (
                  <div className="bg-background/80 border border-neon-cyan/40 p-4 rounded-lg space-y-3 mt-2">
                    <p className="text-xs font-bold text-neon-cyan uppercase tracking-wider">
                      Update Room Credentials for players:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-muted-foreground uppercase mb-1">Room ID</label>
                        <input
                          type="text"
                          placeholder="Enter Room ID"
                          value={tempRoomId}
                          onChange={(e) => setTempRoomId(e.target.value)}
                          className="input-gaming w-full rounded px-3 py-2 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-muted-foreground uppercase mb-1">Room Password</label>
                        <input
                          type="text"
                          placeholder="Enter Password"
                          value={tempRoomPassword}
                          onChange={(e) => setTempRoomPassword(e.target.value)}
                          className="input-gaming w-full rounded px-3 py-2 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleSaveRoomDetails(match.id)}
                      className="btn-solid-orange w-full rounded py-2 text-xs font-bold uppercase tracking-widest"
                    >
                      💾 Save & Publish Room Credentials
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}