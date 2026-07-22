'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface WalletContextType {
  balance: number;
  transactions: any[];
  fetchBalance: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  addTransaction: (type: 'deposit' | 'withdraw', amount: number, utrOrUpiId?: string) => Promise<boolean>;
  supabase: any;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchBalance = useCallback(async (uid?: string) => {
    const currentUid = uid || userId;
    if (!currentUid) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', currentUid)
      .single();

    if (!error && data) {
      setBalance(Number(data.wallet_balance || 0));
    }
  }, [userId]);

  const fetchTransactions = useCallback(async (uid?: string) => {
    const currentUid = uid || userId;
    if (!currentUid) return;

    let combinedList: any[] = [];

    const { data: transData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', currentUid);

    if (transData) {
      combinedList = [...combinedList, ...transData.map((item: any) => ({
        ...item,
        type: item.type || 'deposit',
        sourceTable: 'transactions'
      }))];
    }

    const { data: withdrawData } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', currentUid);

    if (withdrawData) {
      combinedList = [...combinedList, ...withdrawData.map((item: any) => ({
        ...item,
        type: 'withdraw',
        sourceTable: 'withdrawals'
      }))];
    }

    combinedList.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    setTransactions(combinedList);
  }, [userId]);

  useEffect(() => {
    let userChannel: any;
    let transChannel: any;
    let withdrawChannel: any;

    const setupAuthAndRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchBalance(user.id);
        fetchTransactions(user.id);

        userChannel = supabase
          .channel('public:profiles')
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
            (payload: any) => {
              if (payload.new && payload.new.wallet_balance !== undefined) {
                setBalance(Number(payload.new.wallet_balance));
              }
            }
          )
          .subscribe();

        transChannel = supabase
          .channel('public:transactions')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'transactions' },
            () => fetchTransactions(user.id)
          )
          .subscribe();

        withdrawChannel = supabase
          .channel('public:withdrawals')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'withdrawals' },
            () => fetchTransactions(user.id)
          )
          .subscribe();
      }
    };

    setupAuthAndRealtime();

    return () => {
      if (userChannel) supabase.removeChannel(userChannel);
      if (transChannel) supabase.removeChannel(transChannel);
      if (withdrawChannel) supabase.removeChannel(withdrawChannel);
    };
  }, [fetchBalance, fetchTransactions]);

  const addTransaction = useCallback(async (
    type: 'deposit' | 'withdraw', 
    amount: number, 
    utrOrUpiId?: string
  ): Promise<boolean> => {
    if (amount <= 0) {
      alert("Invalid amount!");
      return false;
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData?.user?.id) {
      alert("Aapka session expire ho gaya hai, kripya wapas login karein!");
      return false;
    }

    const currentUserId = authData.user.id;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('username, name, wallet_balance')
      .eq('id', currentUserId)
      .single();

    const playerName = profileData?.username || profileData?.name || authData.user?.email?.split('@')[0] || 'Player';
    const currentAvailableBalance = Number(profileData?.wallet_balance || balance);

    if (type === 'deposit') {
      // 🚀 Deposit ke waqt sirf request save hogi, balance update nahi hoga
      const insertPayload = {
        user_id: currentUserId,
        type: 'deposit',
        amount: amount,
        utrid: utrOrUpiId || null,
        status: 'Pending',
        player_name: playerName
      };

      let { error } = await supabase.from('transactions').insert([insertPayload]);

      if (error && error.message.includes('column')) {
        const fallbackPayload = {
          user_id: currentUserId,
          type: 'deposit',
          amount: amount,
          utrid: utrOrUpiId || null,
          status: 'Pending',
          playerName: playerName
        };
        const res = await supabase.from('transactions').insert([fallbackPayload]);
        error = res.error;
      }

      if (error) {
        console.error("Deposit request failed:", error.message);
        alert("Deposit Error: " + error.message);
        return false;
      }
    } else if (type === 'withdraw') {
      if (currentAvailableBalance < amount) {
        alert(`Insufficient Balance! Available: ₹${currentAvailableBalance}`);
        return false;
      }

      const withdrawPayload = {
        user_id: currentUserId,
        amount: amount,
        status: 'Pending',
        player_name: playerName,
        upi_id: utrOrUpiId || null
      };

      let { error } = await supabase.from('withdrawals').insert([withdrawPayload]);

      if (error && error.message.includes('column')) {
        const fallbackWithdraw = {
          user_id: currentUserId,
          amount: amount,
          status: 'Pending',
          playerName: playerName,
          upiId: utrOrUpiId || null
        };
        const res = await supabase.from('withdrawals').insert([fallbackWithdraw]);
        error = res.error;
      }

      if (error) {
        console.error("Withdrawal request failed:", error.message);
        alert("Withdrawal Error: " + error.message);
        return false;
      }

      // Withdrawal mein balance turant minus hoga kyunki paise user ne nikal liye hain
      const newBalance = currentAvailableBalance - amount;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', currentUserId);

      if (updateError) {
        console.error("Failed to deduct balance:", updateError.message);
      } else {
        setBalance(newBalance);
      }
    }

    fetchTransactions(currentUserId);
    fetchBalance(currentUserId);
    return true;
  }, [balance, fetchTransactions, fetchBalance]);

  return (
    <WalletContext.Provider value={{ balance, transactions, fetchBalance, fetchTransactions, addTransaction, supabase }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export default WalletContext;