'use client';

import React, { useEffect, useState } from 'react';
// Firebase client import karein
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';

// Firebase Configuration (Aap apni config yahan ya lib/firebase.ts se import kar sakte hain)
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

export default function LiveWallet() {
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch live user profile & balance from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
          setProfile(userSnap.data());
        }

        // 2. Fetch live transactions history (Agar transactions collection exist karti hai)
        const txQuery = query(
          collection(db, 'transactions'),
          where('userId', '==', user.uid)
        );
        
        const txSnap = await getDocs(txQuery);
        const txList = txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTransactions(txList);

      } catch (error) {
        console.error('Error fetching wallet data:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="text-xs text-gray-400 p-4 bg-[#161b22] rounded-2xl">Loading wallet data...</div>;
  }

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl text-white">
      {/* Wallet Balance Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest">Available Balance</p>
          <h2 className="text-3xl font-black text-cyan-400">
            ₹{profile ? profile.walletBalance ?? '0' : '0'}
          </h2>
        </div>
        <button 
          onClick={() => alert('Add Funds Gateway Opening...')}
          className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 text-black font-black px-4 py-2 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg"
        >
          + Add Funds
        </button>
      </div>

      {/* Earned & Spent Boxes */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#0d1117] p-3.5 rounded-xl border border-[#30363d]">
          <p className="text-[10px] text-gray-400 uppercase">Total Earned</p>
          <p className="text-lg font-bold text-green-400">₹{profile ? profile.totalEarned ?? '0' : '0'}</p>
        </div>
        <div className="bg-[#0d1117] p-3.5 rounded-xl border border-[#30363d]">
          <p className="text-[10px] text-gray-400 uppercase">Total Spent</p>
          <p className="text-lg font-bold text-red-400">₹{profile ? profile.totalSpent ?? '0' : '0'}</p>
        </div>
      </div>

      {/* Recent Transactions / Txx List */}
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
        Live Transactions History
      </h3>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {transactions.length > 0 ? (
          transactions.map((tx) => (
            <div key={tx.id} className="flex justify-between items-center bg-[#0d1117] p-3 rounded-lg border border-[#30363d] text-xs">
              <div>
                <p className="text-gray-300 font-medium">{tx.title}</p>
                <p className="text-[10px] text-gray-500">{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : ''}</p>
              </div>
              <span className={`font-mono font-bold text-sm ${tx.type === 'earned' ? 'text-green-400' : 'text-red-400'}`}>
                {tx.type === 'earned' ? `+₹${tx.amount}` : `-₹${tx.amount}`}
              </span>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-500 text-center py-4 bg-[#0d1117] rounded-lg border border-[#30363d]">
            No transactions found yet. Play matches to see live Txx records!
          </p>
        )}
      </div>
    </div>
  );
}