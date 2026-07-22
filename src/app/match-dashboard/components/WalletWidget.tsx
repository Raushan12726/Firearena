'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, ArrowUpRight } from 'lucide-react';
import { useWallet } from './WalletContext';

export default function WalletWidget({ onAddFunds, userId }: { onAddFunds: () => void; userId?: string }) {
  const { balance: contextBalance, transactions: contextTransactions, supabase } = useWallet() as any;

  const [earned, setEarned] = useState<number>(0);
  const [spent, setSpent] = useState<number>(0);

  useEffect(() => {
    async function fetchStats() {
      const { data: { user } } = await supabase.auth.getUser();
      const activeUid = userId || user?.id;

      if (!activeUid) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('earned, spent')
        .eq('id', activeUid)
        .single();

      if (profileData) {
        setEarned(profileData.earned || 0);
        setSpent(profileData.spent || 0);
      }
    }

    fetchStats();
  }, [userId, supabase]);

  const displayBalance = contextBalance !== undefined ? contextBalance : 0;
  const displayTransactions = contextTransactions && contextTransactions.length > 0 
    ? contextTransactions.slice(0, 4) 
    : [];

  return (
    <div className="wallet-card rounded-xl overflow-hidden border border-border bg-card">
      <div className="h-0.5 gradient-cyan-orange" />
      <div className="p-4">
        {/* Wallet Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neon-cyan/15 flex items-center justify-center">
              <Wallet size={16} className="text-neon-cyan" />
            </div>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Wallet</p>
          </div>
          <button
            onClick={onAddFunds}
            className="flex items-center gap-1 text-xs btn-neon-orange rounded-lg px-2.5 py-1.5 font-bold cursor-pointer"
          >
            <Plus size={11} />
            Add
          </button>
        </div>

        {/* Live Balance Update */}
        <div className="mb-4">
          <p className="font-display text-3xl font-bold text-foreground tabular-nums">
            ₹<span className="text-neon-cyan">{Number(displayBalance).toLocaleString('en-IN')}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Available Balance</p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-neon-green/10 border border-neon-green/20 rounded-lg p-2.5">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp size={11} className="text-neon-green" />
              <p className="text-[10px] text-muted-foreground tracking-wider">EARNED</p>
            </div>
            <p className="font-display font-bold text-sm text-neon-green tabular-nums">₹{earned.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown size={11} className="text-red-400" />
              <p className="text-[10px] text-muted-foreground tracking-wider">SPENT</p>
            </div>
            <p className="font-display font-bold text-sm text-red-400 tabular-nums">₹{spent.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">
            Recent
          </p>
          <div className="space-y-2">
            {displayTransactions.length > 0 ? (
              displayTransactions.map((tx: any, index: number) => {
                const isCredit = tx.type === 'credit' || tx.type === 'deposit' || tx.type === 'Success' || (tx.amount > 0 && tx.type !== 'withdraw');
                
                return (
                  <div key={`tx-item-${index}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${isCredit ? 'bg-neon-green/15' : 'bg-red-500/15'}`}>
                        {isCredit ? (
                          <ArrowUpRight size={10} className="text-neon-green" />
                        ) : (
                          <ArrowUpRight size={10} className="text-red-400 rotate-180" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate capitalize">
                        {tx.label || tx.sourceTable || tx.type || 'Transaction'}
                      </p>
                    </div>
                    <span className={`text-xs font-bold font-display tabular-nums shrink-0 ml-2 ${isCredit ? 'text-neon-green' : 'text-red-400'}`}>
                      {isCredit ? '+' : '-'}₹{Math.abs(tx.amount || 0)}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-muted-foreground">No recent transactions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}