'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import AppLogo from '@/components/ui/AppLogo';
import { createClient } from '@supabase/supabase-js';
import {
  Eye, EyeOff, Zap, Trophy, Users, Shield,
  ChevronRight, Star, Gamepad2, Target, Crown, Key, ArrowLeft, Lock
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

// ─── Supabase Client Initialization ──────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Particle System ─────────────────────────────────────────────────────────
interface Particle {
  id: string;
  x: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

function ParticleCanvas() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const colors = ['#00d4ff', '#ff6b00', '#a855f7', '#00ff88'];
    const generated: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: `particle-${i}`,
      x: (i * 3.4) % 100,
      size: 2 + (i % 4),
      duration: 8 + (i % 8),
      delay: (i * 0.4) % 6,
      color: colors[i % colors.length],
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full opacity-60"
          style={{
            left: `${p.x}%`,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            animation: `floatParticle ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-grid-pattern opacity-40" />
      <div className="absolute top-0 left-0 w-64 h-64 bg-neon-cyan/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-neon-orange/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-purple/3 rounded-full blur-3xl" />
    </div>
  );
}

// ─── Avatar Selection ─────────────────────────────────────────────────────────
const AVATARS = [
  { id: 'av-1', emoji: '🎯', label: 'Sniper' },
  { id: 'av-2', emoji: '⚔️', label: 'Warrior' },
  { id: 'av-3', emoji: '🔥', label: 'Blaze' },
  { id: 'av-4', emoji: '💀', label: 'Reaper' },
  { id: 'av-5', emoji: '🦅', label: 'Eagle' },
  { id: 'av-6', emoji: '⚡', label: 'Storm' },
  { id: 'av-7', emoji: '🐉', label: 'Dragon' },
  { id: 'av-8', emoji: '🌙', label: 'Phantom' },
];

// ─── Stats Bar ─────────────────────────────────────────────────────────────────
const PLATFORM_STATS = [
  { label: 'Active Players', value: '48,293', icon: Users },
  { label: 'Prize Distributed', value: '₹12.4L', icon: Trophy },
  { label: 'Matches Today', value: '1,847', icon: Gamepad2 },
  { label: 'Top Kill Record', value: '31 Kills', icon: Target },
];

// ─── Login Form ───────────────────────────────────────────────────────────────
interface LoginFormData {
  uid: string;
  password: string;
  remember: boolean;
}

function LoginForm({ onSwitch, onForgot }: { onSwitch: () => void; onForgot: () => void }) {
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.uid,
      password: data.password,
    });
    setIsLoading(false);

    if (!error) {
      toast.success('Welcome back, Soldier! 🔥');
      setTimeout(() => {
        window.location.href = '/match-dashboard';
      }, 800);
    } else {
      toast.error(error?.message || 'Invalid credentials');
    }
  };

  return (
    <div className="animate-slide-up">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
            Free Fire UID / Email
          </label>
          <input
            type="text"
            placeholder="Enter your UID or email"
            className="input-gaming w-full rounded-lg px-4 py-3 text-sm"
            {...register('uid', { required: 'UID or email is required' })}
          />
          {errors.uid && (
            <p className="text-red-400 text-xs mt-1">{errors.uid.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Enter your password"
              className="input-gaming w-full rounded-lg px-4 py-3 pr-12 text-sm"
              {...register('password', { required: 'Password is required' })}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded accent-neon-cyan"
              {...register('remember')}
            />
            <span className="text-xs text-muted-foreground">Remember me</span>
          </label>
          <button type="button" onClick={onForgot} className="text-xs text-neon-cyan hover:underline">
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-solid-cyan w-full rounded-lg py-3 font-display font-bold tracking-widest text-sm uppercase disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-background/40 border-t-background rounded-full animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              <Zap size={16} />
              Enter Arena
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-muted-foreground mt-6">
        New soldier?{' '}
        <button onClick={onSwitch} className="text-neon-cyan hover:underline font-semibold">
          Create Account
        </button>
      </p>
    </div>
  );
}

// ─── Sign Up Form ─────────────────────────────────────────────────────────────
interface SignupFormData {
  playerName: string;
  uid: string;
  email: string;
  phone: string;
  secretKey: string;
  password: string;
  confirmPassword: string;
  avatar: string;
  terms: boolean;
}

function SignupForm({ onSwitch }: { onSwitch: () => void }) {
  const [showPass, setShowPass] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('av-1');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupFormData>({ defaultValues: { avatar: 'av-1' } });

  const password = watch('password');

  const onSignupSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('email, phone')
        .or(`email.eq.${data.email},phone.eq.${data.phone}`)
        .maybeSingle();

      if (existingUser) {
        if (existingUser.email === data.email) {
          toast.error('Is Email address se pehle se hi account bana hua hai!');
          setIsLoading(false);
          return;
        }
        if (existingUser.phone === data.phone) {
          toast.error('Is Mobile Number se pehle se hi account bana hua hai!');
          setIsLoading(false);
          return;
        }
      }

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            player_name: data.playerName,
            uid: data.uid,
            phone: data.phone,
            secret_key: data.secretKey,
            avatar: data.avatar,
          },
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Account Created Successfully! Welcome to FireArena 🔥');
        setTimeout(() => {
          window.location.href = '/match-dashboard';
        }, 1000);
      }
    } catch (error: any) {
      toast.error('Signup failed: ' + (error?.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-slide-up">
      <form onSubmit={handleSubmit(onSignupSubmit)} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">
            Choose Avatar
          </label>
          <div className="grid grid-cols-8 gap-1.5">
            {AVATARS.map((av) => (
              <button
                key={av.id}
                type="button"
                onClick={() => {
                  setSelectedAvatar(av.id);
                  setValue('avatar', av.id);
                }}
                className={`aspect-square rounded-lg text-lg flex items-center justify-center transition-all duration-200 ${
                  selectedAvatar === av.id
                    ? 'bg-neon-cyan/20 border-2 border-neon-cyan shadow-[0_0_12px_rgba(0,212,255,0.4)]'
                    : 'bg-muted border border-border hover:border-neon-cyan/40'
                }`}
                title={av.label}
              >
                {av.emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
              Player Name
            </label>
            <input
              type="text"
              placeholder="YourGameTag"
              className="input-gaming w-full rounded-lg px-3 py-2.5 text-sm"
              {...register('playerName', {
                required: 'Required',
                minLength: { value: 3, message: 'Min 3 chars' },
              })}
            />
            {errors.playerName && (
              <p className="text-red-400 text-xs mt-1">{errors.playerName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
              Free Fire UID
            </label>
            <input
              type="text"
              placeholder="1234567890"
              className="input-gaming w-full rounded-lg px-3 py-2.5 text-sm"
              {...register('uid', {
                required: 'Required',
                pattern: { value: /^\d{9,12}$/, message: '9-12 digit UID' },
              })}
            />
            {errors.uid && (
              <p className="text-red-400 text-xs mt-1">{errors.uid.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            placeholder="soldier@email.com"
            className="input-gaming w-full rounded-lg px-3 py-2.5 text-sm"
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
            })}
          />
          {errors.email && (
            <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
            Indian Mobile Number
          </label>
          <div className="flex gap-2">
            <span className="input-gaming rounded-lg px-3 py-2.5 text-sm text-muted-foreground flex items-center whitespace-nowrap">
              +91
            </span>
            <input
              type="tel"
              placeholder="9876543210"
              className="input-gaming flex-1 rounded-lg px-3 py-2.5 text-sm"
              {...register('phone', {
                required: 'Phone required',
                pattern: { value: /^[6-9]\d{9}$/, message: 'Valid 10-digit number' },
              })}
            />
          </div>
          {errors.phone && (
            <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold tracking-widest text-neon-cyan uppercase mb-1.5 flex items-center gap-1">
            <Key size={12} /> 6-Digit Security Key (For Recovery)
          </label>
          <input
            type="text"
            maxLength={6}
            placeholder="e.g. 849201"
            className="input-gaming w-full rounded-lg px-3 py-2.5 text-sm font-mono tracking-widest text-neon-cyan"
            {...register('secretKey', {
              required: 'Security key is required',
              pattern: { value: /^\d{6}$/, message: 'Must be strictly 6 digits' },
            })}
          />
          {errors.secretKey && (
            <p className="text-red-400 text-xs mt-1">{errors.secretKey.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Min 8 chars"
                className="input-gaming w-full rounded-lg px-3 py-2.5 pr-10 text-sm"
                {...register('password', {
                  required: 'Required',
                  minLength: { value: 8, message: 'Min 8 chars' },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
              Confirm
            </label>
            <input
              type="password"
              placeholder="Repeat password"
              className="input-gaming w-full rounded-lg px-3 py-2.5 text-sm"
              {...register('confirmPassword', {
                required: 'Required',
                validate: (v) => v === password || 'Passwords do not match',
              })}
            />
            {errors.confirmPassword && (
              <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 mt-0.5 accent-neon-cyan"
            {...register('terms', { required: 'You must accept terms' })}
          />
          <span className="text-xs text-muted-foreground leading-relaxed">
            I agree to FireArena Terms of Service & Privacy Policy
          </span>
        </label>
        {errors.terms && (
          <p className="text-red-400 text-xs">{errors.terms.message}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="btn-solid-orange w-full rounded-lg py-3 font-display font-bold tracking-widest text-sm uppercase disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Registering...
            </>
          ) : (
            <>
              <Crown size={16} />
              Create Account
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-muted-foreground mt-4">
        Already a soldier?{' '}
        <button onClick={onSwitch} className="text-neon-cyan hover:underline font-semibold">
          Sign In
        </button>
      </p>
    </div>
  );
}

// ─── Forgot Password Form Component ───────────────────────────────────────────
function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { email: '', secretKey: '', newPassword: '', confirmPassword: '' },
  });

  const newPassword = watch('newPassword');

  const onResetSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.email)
        .eq('secret_key', data.secretKey)
        .maybeSingle();

      if (error || !userProfile) {
        toast.error('Email ya Secret Key sahi nahi hai!');
        setIsLoading(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) {
        toast.error('Password reset failed: ' + updateError.message);
      } else {
        toast.success('Password Successfully Reset! Ab aap Login kar sakte hain. 🔥');
        setTimeout(() => {
          onBack();
        }, 1500);
      }
    } catch (err: any) {
      toast.error('Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-slide-up space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="font-display text-base font-bold text-foreground uppercase tracking-wider">
          Recover Password
        </h2>
      </div>

      <form onSubmit={handleSubmit(onResetSubmit)} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
            Registered Email Address
          </label>
          <input
            type="email"
            placeholder="soldier@email.com"
            className="input-gaming w-full rounded-lg px-3 py-2.5 text-sm"
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email && (
            <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold tracking-widest text-neon-cyan uppercase mb-1.5 flex items-center gap-1">
            <Key size={12} /> Your 6-Digit Secret Key
          </label>
          <input
            type="text"
            maxLength={6}
            placeholder="e.g. 849201"
            className="input-gaming w-full rounded-lg px-3 py-2.5 text-sm font-mono tracking-widest text-neon-cyan"
            {...register('secretKey', {
              required: 'Secret Key required',
              pattern: { value: /^\d{6}$/, message: 'Must be 6 digits' },
            })}
          />
          {errors.secretKey && (
            <p className="text-red-400 text-xs mt-1">{errors.secretKey.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Enter new password"
              className="input-gaming w-full rounded-lg px-3 py-2.5 pr-10 text-sm"
              {...register('newPassword', {
                required: 'Required',
                minLength: { value: 8, message: 'Min 8 chars' },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-red-400 text-xs mt-1">{errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
            Confirm New Password
          </label>
          <input
            type="password"
            placeholder="Repeat new password"
            className="input-gaming w-full rounded-lg px-3 py-2.5 text-sm"
            {...register('confirmPassword', {
              required: 'Required',
              validate: (v) => v === newPassword || 'Passwords do not match',
            })}
          />
          {errors.confirmPassword && (
            <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-solid-cyan w-full rounded-lg py-3 font-display font-bold tracking-widest text-sm uppercase disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-background/40 border-t-background rounded-full animate-spin" />
              Resetting...
            </>
          ) : (
            <>
              <Lock size={16} />
              Reset Password
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// ─── Main Auth Page ───────────────────────────────────────────────────────────
export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'signup' | 'forgot'>('login');

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
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
      <ParticleCanvas />

      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <AppLogo size={36} />
          <span className="font-display text-xl font-bold tracking-widest neon-text-cyan">
            FIRE<span className="text-neon-orange">ARENA</span>
          </span>
        </div>
        <Link
          href="/match-dashboard"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          Browse Matches <ChevronRight size={14} />
        </Link>
      </header>

      <div className="relative z-10 px-6 py-2">
        <div className="max-w-screen-2xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {PLATFORM_STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={`stat-${stat.label}`}
                className="card-surface rounded-lg px-4 py-3 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded bg-neon-cyan/10 flex items-center justify-center">
                  <Icon size={16} className="text-neon-cyan" />
                </div>
                <div>
                  <p className="text-sm font-bold font-display text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="card-surface rounded-2xl border border-border overflow-hidden animate-border-glow shadow-2xl">
            <div className="relative px-6 pt-6 pb-0">
              <div className="absolute top-0 left-0 right-0 h-1 gradient-cyan-orange" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-orange/20 border border-neon-cyan/30 flex items-center justify-center">
                  <Shield size={20} className="text-neon-cyan" />
                </div>
                <div>
                  <h1 className="font-display text-xl font-bold text-foreground tracking-wider">
                    {tab === 'login' ? 'WELCOME BACK' : tab === 'signup' ? 'JOIN THE ARENA' : 'RECOVER ACCOUNT'}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {tab === 'login'
                      ? 'Sign in to your FireArena account'
                      : tab === 'signup'
                      ? 'Create your Free Fire tournament account'
                      : 'Reset password using your Security Key'}
                  </p>
                </div>
              </div>

              {tab !== 'forgot' && (
                <div className="flex border-b border-border">
                  <button
                    onClick={() => setTab('login')}
                    className={`flex-1 py-2.5 text-sm font-display font-semibold tracking-wider transition-all duration-200 ${
                      tab === 'login' ? 'tab-active' : 'tab-inactive'
                    }`}
                  >
                    SIGN IN
                  </button>
                  <button
                    onClick={() => setTab('signup')}
                    className={`flex-1 py-2.5 text-sm font-display font-semibold tracking-wider transition-all duration-200 ${
                      tab === 'signup' ? 'tab-active' : 'tab-inactive'
                    }`}
                  >
                    REGISTER
                  </button>
                </div>
              )}
            </div>

            <div
              className={`px-6 py-5 scrollbar-gaming ${
                tab === 'signup' || tab === 'forgot' ? 'max-h-[65vh] overflow-y-auto' : ''
              }`}
            >
              {tab === 'login' ? (
                <LoginForm onSwitch={() => setTab('signup')} onForgot={() => setTab('forgot')} />
              ) : tab === 'signup' ? (
                <SignupForm onSwitch={() => setTab('login')} />
              ) : (
                <ForgotPasswordForm onBack={() => setTab('login')} />
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-4">
            <Star size={12} className="text-neon-orange" />
            <p className="text-xs text-muted-foreground text-center">
              India&apos;s #1 Free Fire Tournament Platform • Secure UPI Payments
            </p>
            <Star size={12} className="text-neon-orange" />
          </div>
        </div>
      </div>
    </div>
  );
}