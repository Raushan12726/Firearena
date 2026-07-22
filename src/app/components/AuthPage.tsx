'use client';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import AppLogo from '@/components/ui/AppLogo';
import { Eye, EyeOff, Zap, Shield, ChevronRight, Star, Trophy, Users, Gamepad2, Target, Crown, LogOut, Wallet } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// ─── Firebase Initialization ─────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// ─── Particle System Background ─────────────────────────────────────────────
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
    const generated: Particle[] = Array.from({ length: 25 }, (_, i) => ({
      id: `particle-${i}`,
      x: (i * 4) % 100,
      size: 2 + (i % 3),
      duration: 8 + (i % 6),
      delay: (i * 0.3) % 5,
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
    </div>
  );
}

// ─── Avatar Selection Options ───────────────────────────────────────────────
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

const PLATFORM_STATS = [
  { label: 'Active Players', value: '48,293', icon: Users },
  { label: 'Prize Distributed', value: '₹12.4L', icon: Trophy },
  { label: 'Matches Today', value: '1,847', icon: Gamepad2 },
  { label: 'Top Kill Record', value: '31 Kills', icon: Target },
];

// ─── Login Form Component ───────────────────────────────────────────────────
interface LoginFormData {
  email: string;
  password: string;
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        localStorage.setItem('firearena_user', JSON.stringify({
          name: userData.playerName || 'Player',
          email: user.email,
          uid: userData.uid || 'N/A'
        }));
      } else {
        localStorage.setItem('firearena_user', JSON.stringify({
          name: user.email?.split('@')[0] || 'Player',
          email: user.email,
          uid: 'N/A'
        }));
      }

      toast.success('Welcome back, Soldier! 🔥');
      setTimeout(() => window.location.reload(), 800);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error('Invalid email or password. Please check credentials.');
      } else {
        toast.error(error.message || 'Login failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-slide-up">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            placeholder="Enter your registered email"
            className="input-gaming w-full rounded-lg px-4 py-3 text-sm"
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
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
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-solid-cyan w-full rounded-lg py-3 font-display font-bold tracking-widest text-sm uppercase disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-background/40 border-t-background rounded-full animate-spin" />
              Signing In...
            </>
          ) : (
            <>
              <Zap size={16} />
              Enter Arena (Sign In)
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-muted-foreground mt-6">
        New soldier?{' '}
        <button onClick={onSwitch} className="text-neon-cyan hover:underline font-semibold">
          Create Account (Register)
        </button>
      </p>
    </div>
  );
}

// ─── Sign Up Form Component (OTP-Free) ──────────────────────────────────────
interface SignupFormData {
  playerName: string;
  uid: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  avatar: string;
  terms: boolean;
}

function SignupForm({ onSwitch }: { onSwitch: () => void }) {
  const [showPass, setShowPass] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('av-1');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SignupFormData>({
    defaultValues: { avatar: 'av-1' }
  });

  const password = watch('password');

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      // Direct Firebase Account Creation
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Save user details to Firestore database
      await setDoc(doc(db, 'users', user.uid), {
        uid: data.uid,
        playerName: data.playerName,
        email: data.email,
        phone: data.phone,
        avatar: data.avatar,
        walletBalance: 0,
        totalEarned: 0,
        createdAt: new Date().toISOString()
      });

      // Save to LocalStorage for profile view
      localStorage.setItem('firearena_user', JSON.stringify({
        name: data.playerName,
        email: data.email,
        uid: data.uid
      }));

      toast.success('Account created successfully! 🔥');
      setTimeout(() => window.location.reload(), 800);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error('This Gmail is already registered! Please use Sign In instead.');
      } else {
        toast.error(error.message || 'Registration failed!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-slide-up">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
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
              {...register('playerName', { required: 'Required', minLength: { value: 3, message: 'Min 3 chars' } })}
            />
            {errors.playerName && <p className="text-red-400 text-xs mt-1">{errors.playerName.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
              Free Fire UID
            </label>
            <input
              type="text"
              placeholder="1234567890"
              className="input-gaming w-full rounded-lg px-3 py-2.5 text-sm"
              {...register('uid', { required: 'Required', pattern: { value: /^\d{5,15}$/, message: 'Valid UID required' } })}
            />
            {errors.uid && <p className="text-red-400 text-xs mt-1">{errors.uid.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
            Gmail Address (One-time use)
          </label>
          <input
            type="email"
            placeholder="soldier@gmail.com"
            className="input-gaming w-full rounded-lg px-3 py-2.5 text-sm"
            {...register('email', { required: 'Email required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })}
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
            Indian Mobile Number
          </label>
          <div className="flex gap-2">
            <span className="input-gaming rounded-lg px-3 py-2.5 text-sm text-muted-foreground flex items-center whitespace-nowrap">+91</span>
            <input
              type="tel"
              placeholder="9876543210"
              className="input-gaming flex-1 rounded-lg px-3 py-2.5 text-sm"
              {...register('phone', { required: 'Phone required', pattern: { value: /^[6-9]\d{9}$/, message: 'Valid 10-digit number' } })}
            />
          </div>
          {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Min 6 chars"
                className="input-gaming w-full rounded-lg px-3 py-2.5 pr-10 text-sm"
                {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
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
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>
        </div>

        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 mt-0.5 accent-neon-cyan" {...register('terms', { required: 'Accept terms' })} />
          <span className="text-xs text-muted-foreground leading-relaxed">
            I agree to FireArena <span className="text-neon-cyan hover:underline">Terms</span> & <span className="text-neon-cyan hover:underline">Privacy</span>
          </span>
        </label>
        {errors.terms && <p className="text-red-400 text-xs">{errors.terms.message}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="btn-solid-orange w-full rounded-lg py-3 font-display font-bold tracking-widest text-sm uppercase disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              <Crown size={16} />
              Create Account (Register)
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-muted-foreground mt-4">
        Already registered?{' '}
        <button onClick={onSwitch} className="text-neon-cyan hover:underline font-semibold">
          Sign In
        </button>
      </p>
    </div>
  );
}

// ─── Dashboard View ─────────────────────────────────────────────────────────
function DashboardView() {
  const [userData, setUserData] = useState({ name: 'Soldier', email: 'user@firearena.gg', uid: 'Loading...' });
  const [dropdownOpen, setDropdownOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('firearena_user');
    if (saved) {
      try { setUserData(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('firearena_user');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col p-6">
      <header className="flex items-center justify-between pb-6 border-b border-border">
        <div className="flex items-center gap-2">
          <AppLogo size={36} />
          <span className="font-display text-xl font-bold tracking-widest neon-text-cyan">
            FIRE<span className="text-neon-orange">ARENA</span>
          </span>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 bg-muted/60 border border-border px-3 py-1.5 rounded-lg hover:border-neon-cyan transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-neon-cyan/20 border border-neon-cyan flex items-center justify-center text-xs font-bold text-neon-cyan">
              {userData.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-display text-sm font-semibold text-foreground">{userData.name}</span>
            <ChevronRight size={14} className={`text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-90' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 card-surface rounded-xl border border-border shadow-2xl p-4 z-50 animate-slide-up">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Signed in as</p>
              <p className="text-sm font-bold text-neon-cyan truncate mb-3">{userData.email}</p>
              
              <div className="space-y-1.5 bg-background/50 p-2.5 rounded-lg border border-border mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Player Name:</span>
                  <span className="font-semibold text-foreground">{userData.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Gmail ID:</span>
                  <span className="font-semibold text-foreground truncate max-w-[150px]">{userData.email}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Free Fire UID:</span>
                  <span className="font-semibold text-neon-orange">{userData.uid}</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 font-display font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-screen-xl mx-auto w-full py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Live Tournaments Dashboard</h1>
            <p className="text-xs text-muted-foreground">Select a match to join and win cash prizes!</p>
          </div>
          <button className="btn-solid-orange px-4 py-2 rounded-lg text-xs font-bold font-display uppercase flex items-center gap-2">
            <Wallet size={14} /> Add Funds
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-surface p-5 rounded-xl border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Available Balance</p>
            <p className="text-2xl font-bold font-display text-neon-cyan">₹0</p>
          </div>
          <div className="card-surface p-5 rounded-xl border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Winnings</p>
            <p className="text-2xl font-bold font-display text-neon-green">₹0</p>
          </div>
          <div className="card-surface p-5 rounded-xl border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Matches Played</p>
            <p className="text-2xl font-bold font-display text-neon-orange">0</p>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────────────────
export default function AuthPage() {
  const [tab, setTab] = useState<'signup' | 'login'>('signup');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('firearena_user');
    if (saved) setIsLoggedIn(true);
  }, []);

  if (isLoggedIn) {
    return <DashboardView />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <Toaster position="top-right" toastOptions={{ style: { background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' } }} />
      <ParticleCanvas />

      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <AppLogo size={36} />
          <span className="font-display text-xl font-bold tracking-widest neon-text-cyan">
            FIRE<span className="text-neon-orange">ARENA</span>
          </span>
        </div>
      </header>

      <div className="relative z-10 px-6 py-2">
        <div className="max-w-screen-2xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {PLATFORM_STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={`stat-${stat.label}`} className="card-surface rounded-lg px-4 py-3 flex items-center gap-3">
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
          <div className="card-surface rounded-2xl border border-border overflow-hidden shadow-2xl">
            <div className="relative px-6 pt-6 pb-0">
              <div className="absolute top-0 left-0 right-0 h-1 gradient-cyan-orange" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-orange/20 border border-neon-cyan/30 flex items-center justify-center">
                  <Shield size={20} className="text-neon-cyan" />
                </div>
                <div>
                  <h1 className="font-display text-xl font-bold text-foreground tracking-wider">
                    {tab === 'signup' ? 'JOIN THE ARENA' : 'WELCOME BACK'}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {tab === 'signup' ? 'Create your Free Fire tournament account' : 'Sign in to your FireArena account'}
                  </p>
                </div>
              </div>

              <div className="flex border-b border-border">
                <button
                  onClick={() => setTab('signup')}
                  className={`flex-1 py-2.5 text-sm font-display font-semibold tracking-wider transition-all ${tab === 'signup' ? 'tab-active' : 'tab-inactive'}`}
                >
                  REGISTER (CREATE)
                </button>
                <button
                  onClick={() => setTab('login')}
                  className={`flex-1 py-2.5 text-sm font-display font-semibold tracking-wider transition-all ${tab === 'login' ? 'tab-active' : 'tab-inactive'}`}
                >
                  SIGN IN
                </button>
              </div>
            </div>

            <div className={`px-6 py-5 scrollbar-gaming ${tab === 'signup' ? 'max-h-[60vh] overflow-y-auto' : ''}`}>
              {tab === 'signup' ? (
                <SignupForm onSwitch={() => setTab('login')} />
              ) : (
                <LoginForm onSwitch={() => setTab('signup')} />
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-4">
            <Star size={12} className="text-neon-orange" />
            <p className="text-xs text-muted-foreground text-center">
              India&apos;s #1 Free Fire Tournament Platform • Secure Payments
            </p>
            <Star size={12} className="text-neon-orange" />
          </div>
        </div>
      </div>
    </div>
  );
}