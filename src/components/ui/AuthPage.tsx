'use client';

import React, { useState } from 'react';
// Aapke LiveWallet ke tarah centralized Supabase client import kiya gaya hai
import { supabase } from '@/lib/supabaseClient';

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [uid, setUid] = useState('');
  const [phone, setPhone] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // MATCH DASHBOARD REDIRECT (useEffect) HATA DIYA GAYA HAI

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // MATCH DASHBOARD REDIRECT HATA DIYA GAYA HAI
        setSuccessMessage('Login Successful! ✅');

      } else if (authMode === 'register') {
        if (secretKey.length !== 6 || isNaN(Number(secretKey))) {
          throw new Error('Secret key strictly 6 digits ki honi chahiye!');
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        // PROFILES TABLE MEIN INSERT KARNE KA LOGIC HATA DIYA GAYA HAI

        setSuccessMessage('Account Created Successfully! 🔥');
        setTimeout(() => {
          setAuthMode('login');
          setSuccessMessage('');
          setPassword('');
          setSecretKey('');
        }, 1500);

      } else if (authMode === 'forgot') {
        
        // PROFILES TABLE SE SECRET KEY CHECK KARNE KA LOGIC HATA DIYA GAYA HAI
        // Kyunki ab profile data save nahi ho raha, isliye check nahi ho sakta.
        setSuccessMessage('Account verification logic removed (Profile DB disabled).');
        
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4 text-white">
      <div className="bg-[#161b22] border border-[#30363d] p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-black text-cyan-400 mb-6 text-center uppercase tracking-wider">
          {authMode === 'login' && 'FireArena Login'}
          {authMode === 'register' && 'Create Free Fire Account'}
          {authMode === 'forgot' && 'Recover Account'}
        </h2>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 text-xs p-3 rounded-xl mb-4">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-500/10 border border-green-500 text-green-400 text-xs p-3 rounded-xl mb-4">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'register' && (
            <>
              <div>
                <label className="text-xs text-gray-400 uppercase">Player Name (IGN)</label>
                <input
                  type="text"
                  required
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter Free Fire Name"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-3 text-sm text-white mt-1 focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase">Free Fire UID</label>
                <input
                  type="text"
                  required
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="Enter FF UID numbers"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-3 text-sm text-white mt-1 focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase">Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter Mobile Number"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-3 text-sm text-white mt-1 focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-cyan-400 uppercase font-bold">6-Digit Secret Key (For Recovery)</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="e.g. 582910"
                  className="w-full bg-[#0d1117] border border-cyan-500/50 rounded-xl p-3 text-sm text-white mt-1 focus:border-cyan-400 outline-none tracking-widest font-mono"
                />
                <p className="text-[10px] text-gray-500 mt-1">Is 6-digit key ko yaad rakhein, password recovery ke liye zaroori hai.</p>
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-gray-400 uppercase">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-3 text-sm text-white mt-1 focus:border-cyan-400 outline-none"
            />
          </div>

          {authMode !== 'forgot' && (
            <div>
              <label className="text-xs text-gray-400 uppercase">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-3 text-sm text-white mt-1 focus:border-cyan-400 outline-none"
              />
            </div>
          )}

          {authMode === 'forgot' && (
            <div>
              <label className="text-xs text-cyan-400 uppercase font-bold">Aapki 6-Digit Secret Key</label>
              <input
                type="text"
                maxLength={6}
                required
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Enter 6-digit key"
                className="w-full bg-[#0d1117] border border-cyan-500/50 rounded-xl p-3 text-sm text-white mt-1 focus:border-cyan-400 outline-none tracking-widest font-mono"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 text-black font-black py-3 rounded-xl uppercase tracking-widest text-xs transition-all shadow-lg mt-2 cursor-pointer"
          >
            {loading ? 'Processing...' : authMode === 'login' ? 'Login' : authMode === 'register' ? 'Register' : 'Verify'}
          </button>
        </form>

        {/* Navigation Switchers */}
        <div className="mt-6 flex flex-col space-y-2 text-center">
          {authMode === 'login' && (
            <>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="text-xs text-cyan-400 hover:underline cursor-pointer"
              >
                Don't have an account? Register
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('forgot')}
                className="text-xs text-gray-400 hover:text-cyan-400 cursor-pointer"
              >
                Forgot Password? (Use 6-Digit Key)
              </button>
            </>
          )}

          {authMode === 'register' && (
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className="text-xs text-cyan-400 hover:underline cursor-pointer"
            >
              Already have an account? Login
            </button>
          )}

          {authMode === 'forgot' && (
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className="text-xs text-cyan-400 hover:underline cursor-pointer"
            >
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}