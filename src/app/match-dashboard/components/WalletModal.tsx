'use client';

import React, { useState, useEffect } from 'react';
import { X, Wallet, ArrowUpRight, ArrowDownLeft, Copy, CheckCircle, Loader2, Clock, SendHorizonal } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from './WalletContext';

interface WalletModalProps {
  onClose: () => void;
  matchId?: string;
  entryFee?: number;
  userId?: string;
  onJoinSuccess?: () => void;
}

export default function WalletModal({ onClose, matchId, entryFee = 0, userId, onJoinSuccess }: WalletModalProps) {
  const [tab, setTab] = useState<'balance' | 'deposit' | 'withdraw' | 'join'>('balance');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [depositAmount, setDepositAmount] = useState('');
  const [depositUtr, setDepositUtr] = useState('');
  const [depositErrors, setDepositErrors] = useState<{ amount?: string; utrId?: string }>({});

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawUpi, setWithdrawUpi] = useState('');
  const [withdrawErrors, setWithdrawErrors] = useState<{ amount?: string; upiId?: string }>({});
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  const [joining, setJoining] = useState(false);

  const { balance: contextBalance, transactions, addTransaction, supabase, user } = useWallet() as any;
  const [availableBalance, setAvailableBalance] = useState<number>(contextBalance || 0);

  const upiId = 'raushan.13@ptyes';

  const fetchWalletBalance = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const currentUserId = userId || user?.id || authUser?.id;
      if (!currentUserId) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', currentUserId)
        .single();

      if (data && !error) {
        setAvailableBalance(Number(data.wallet_balance || 0));
      }
    } catch (err) {
      console.error("Error fetching wallet balance:", err);
    }
  };

  useEffect(() => {
    fetchWalletBalance();
    const interval = setInterval(fetchWalletBalance, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (contextBalance !== undefined) {
      setAvailableBalance(contextBalance);
    }
  }, [contextBalance]);

  const validateDeposit = (): boolean => {
    const errs: { amount?: string; utrId?: string } = {};
    const amt = parseFloat(depositAmount);
    
    if (!depositAmount) errs.amount = 'Amount is required';
    else if (isNaN(amt) || amt < 50) errs.amount = 'Minimum ₹50';
    else if (amt > 10000) errs.amount = 'Maximum ₹10,000';

    const cleanUtr = depositUtr.trim();
    if (!cleanUtr) {
      errs.utrId = 'UTR / Transaction ID is required';
    } else if (cleanUtr.length < 6) {
      errs.utrId = 'UTR / Transaction ID must be at least 6 digits';
    }

    setDepositErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDeposit()) return;

    const { data: { user: authUser } } = await supabase.auth.getUser();
    const currentUserId = userId || user?.id || authUser?.id;

    if (!currentUserId) {
      toast.error('User session not found! Please relogin.');
      return;
    }

    setSubmitting(true);
    const success = await addTransaction('deposit', parseFloat(depositAmount), depositUtr, currentUserId);
    setSubmitting(false);

    if (success) {
      setSubmitted(true);
      toast.success('Deposit request submitted! Admin will verify it shortly.');
      fetchWalletBalance();
    } else {
      toast.error('Failed to submit deposit request.');
    }
  };

  const validateWithdraw = (): boolean => {
    const errs: { amount?: string; upiId?: string } = {};
    const amt = parseFloat(withdrawAmount);
    if (!withdrawAmount) errs.amount = 'Amount is required';
    else if (isNaN(amt) || amt < 50) errs.amount = 'Minimum withdrawal is ₹50';
    else if (amt > availableBalance) errs.amount = `Insufficient balance. Available: ₹${availableBalance.toLocaleString('en-IN')}`;
    
    if (!withdrawUpi.trim()) {
      errs.upiId = 'UPI ID / Number is required';
    } else if (!/^[\w.\-]+@[\w]+$/.test(withdrawUpi.trim())) {
      errs.upiId = 'Enter a valid UPI ID (e.g. 9876543210@paytm)';
    }

    setWithdrawErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onwithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateWithdraw()) return;

    const { data: { user: authUser } } = await supabase.auth.getUser();
    const currentUserId = userId || user?.id || authUser?.id;

    if (!currentUserId) {
      toast.error('User session not found! Please relogin.');
      return;
    }

    const amt = parseFloat(withdrawAmount);
    setWithdrawSubmitting(true);

    const success = await addTransaction('withdraw', amt, withdrawUpi, currentUserId);
    setWithdrawSubmitting(false);

    if (success) {
      toast.success(`Withdrawal of ₹${amt.toLocaleString('en-IN')} initiated to ${withdrawUpi}`);
      setWithdrawAmount('');
      setWithdrawUpi('');
      setWithdrawErrors({});
      fetchWalletBalance();
    } else {
      toast.error('Insufficient balance or failed to process withdrawal.');
    }
  };

  const handleJoinTournament = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const currentUserId = userId || user?.id || authUser?.id;

    if (!matchId || !currentUserId) {
      toast.error('Match details or user session missing');
      return;
    }

    if (availableBalance < entryFee) {
      toast.error('Insufficient balance! Please add money to your wallet.');
      setTab('deposit');
      return;
    }

    setJoining(true);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ wallet_balance: availableBalance - entryFee })
      .eq('id', currentUserId);

    if (updateError) {
      toast.error('Failed to deduct entry fee');
      setJoining(false);
      return;
    }

    const { error: joinError } = await supabase
      .from('match_participants')
      .insert([{ match_id: matchId, user_id: currentUserId }]);

    if (joinError) {
      await supabase.from('profiles').update({ wallet_balance: availableBalance }).eq('id', currentUserId);
      toast.error('Failed to join tournament');
      setJoining(false);
      return;
    }

    toast.success('Successfully joined tournament & entry fee deducted!');
    setJoining(false);
    fetchWalletBalance();
    if (onJoinSuccess) onJoinSuccess();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border overflow-hidden animate-slide-in-up"
        style={{ background: 'var(--surface-2)', boxShadow: '0 0 60px rgba(0,212,255,0.1)' }}
      >
        <div className="px-5 py-4 flex items-center justify-between border-b border-border" style={{ background: 'rgba(0,255,136,0.05)' }}>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-neon-green" />
            <span className="font-bold text-foreground">My Wallet & Match Entry</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className="px-5 py-5 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.06), rgba(0,212,255,0.04))' }}
        >
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Available Balance</p>
          <p className="neon-text-green text-4xl font-bold font-mono-nums">₹{availableBalance.toLocaleString('en-IN')}</p>
          <p className="text-muted-foreground text-xs mt-1">FireArena Wallet</p>
        </div>

        <div className="flex border-b border-border">
          <button
            onClick={() => setTab('balance')}
            className={`flex-1 py-3 text-xs font-semibold transition-colors ${
              tab === 'balance' ? 'text-neon-cyan border-b-2 border-neon-cyan' : 'text-muted-foreground'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setTab('deposit')}
            className={`flex-1 py-3 text-xs font-semibold transition-colors ${
              tab === 'deposit' ? 'text-neon-cyan border-b-2 border-neon-cyan' : 'text-muted-foreground'
            }`}
          >
            Add Money
          </button>
          <button
            onClick={() => setTab('withdraw')}
            className={`flex-1 py-3 text-xs font-semibold transition-colors ${
              tab === 'withdraw' ? 'text-neon-cyan border-b-2 border-neon-cyan' : 'text-muted-foreground'
            }`}
          >
            Withdraw
          </button>
          {matchId && (
            <button
              onClick={() => setTab('join')}
              className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                tab === 'join' ? 'text-neon-green border-b-2 border-neon-green' : 'text-muted-foreground'
              }`}
            >
              Join Match
            </button>
          )}
        </div>

        <div className="p-5" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {tab === 'balance' && (
            <div className="space-y-2">
              {transactions && transactions.length > 0 ? (
                transactions.map((txn: any, index: number) => {
                  const isCredit = txn.type === 'credit' || txn.type === 'deposit' || txn.type === 'Success' || txn.amount > 0;
                  const txnStatus = (txn.status || 'Pending').toLowerCase();
                  return (
                    <div
                      key={`${txn.id || txn.utrid || 'txn'}-${index}`}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg border border-border hover:border-muted-foreground transition-colors"
                      style={{ background: 'var(--surface-3)' }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: isCredit ? 'rgba(0,255,136,0.12)' : 'rgba(255,61,61,0.12)' }}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="w-4 h-4 text-neon-green" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-danger" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-medium truncate capitalize">
                          {txn.label || txn.sourceTable || txn.type || 'Transaction'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {txn.created_at ? new Date(txn.created_at).toLocaleString() : 'Recent'}
                          </span>
                          {txnStatus === 'pending' && (
                            <span className="flex items-center gap-1 text-xs text-warning">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                          {txnStatus === 'success' && (
                            <span className="text-xs text-neon-green font-semibold">Success</span>
                          )}
                          {txnStatus === 'rejected' && (
                            <span className="text-xs text-danger font-semibold">Rejected</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-sm font-bold font-mono-nums ${isCredit ? 'text-neon-green' : 'text-danger'}`}>
                        {isCredit ? '+' : '-'}₹{Math.abs(txn.amount || 0)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground text-sm py-6">No transactions found.</p>
              )}
            </div>
          )}

          {tab === 'deposit' && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto rounded-xl border border-neon-cyan/30 flex items-center justify-center mb-3 overflow-hidden bg-white">
                  <img src="/QR Code.jpg" alt="UPI QR Code" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-sm font-mono font-bold text-neon-cyan">{upiId}</span>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(upiId); toast.success('UPI ID copied'); }} className="text-muted-foreground hover:text-neon-cyan transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Scan with any UPI app to pay</p>
              </div>

              {submitted ? (
                <div className="rounded-xl p-5 text-center border border-neon-green" style={{ background: 'rgba(0,255,136,0.06)' }}>
                  <CheckCircle className="w-10 h-10 text-neon-green mx-auto mb-3" />
                  <p className="text-foreground font-bold mb-1">Request Submitted!</p>
                  <p className="text-muted-foreground text-sm">Admin will verify your UTR and credit your wallet shortly.</p>
                </div>
              ) : (
                <form onSubmit={onDeposit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Amount (₹)</label>
                    <p className="text-muted-foreground text-[10px] mb-2">Minimum ₹50 · Maximum ₹10,000</p>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={depositAmount}
                      onChange={(e) => {
                        setDepositAmount(e.target.value);
                        if (depositErrors.amount) setDepositErrors(p => ({ ...p, amount: undefined }));
                      }}
                      className="input-gaming w-full px-4 py-3 text-sm font-mono"
                    />
                    {depositErrors.amount && <p className="text-danger text-xs mt-1">{depositErrors.amount}</p>}
                  </div>

                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Quick Select Amount</p>
                    <div className="flex gap-2">
                      {[100, 200, 500, 1000].map((amt) => (
                        <button
                          key={`quick-dep-${amt}`}
                          type="button"
                          onClick={() => setDepositAmount(String(amt))}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold border border-border hover:border-neon-cyan hover:text-neon-cyan transition-all"
                          style={{ background: 'var(--surface-3)' }}
                        >
                          +₹{amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">UTR / TRANSACTION ID</label>
                    <p className="text-muted-foreground text-[10px] mb-2">Enter UTR or Transaction ID from your payment app (6 to 12 digits)</p>
                    <input
                      type="text"
                      placeholder="e.g. 402812938471 (6 to 12 digits)"
                      value={depositUtr}
                      onChange={(e) => {
                        setDepositUtr(e.target.value);
                        if (depositErrors.utrId) setDepositErrors(p => ({ ...p, utrId: undefined }));
                      }}
                      className="input-gaming w-full px-4 py-3 text-sm font-mono"
                    />
                    {depositErrors.utrId && <p className="text-danger text-xs mt-1">{depositErrors.utrId}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.08))',
                      border: '1px solid rgba(0,212,255,0.4)',
                      color: 'var(--neon-cyan)',
                    }}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Deposit Request'}
                  </button>
                </form>
              )}
            </div>
          )}

          {tab === 'withdraw' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between px-4 py-3 rounded-xl border" style={{ background: 'rgba(0,255,136,0.05)', borderColor: 'rgba(0,255,136,0.2)' }}>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Available to Withdraw</p>
                  <p className="text-xl font-bold neon-text-green font-mono-nums mt-0.5">₹{availableBalance.toLocaleString('en-IN')}</p>
                </div>
                <Wallet className="w-8 h-8 text-neon-green opacity-40" />
              </div>

              <form onSubmit={onwithdraw} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Withdrawal Amount (₹)</label>
                  <p className="text-muted-foreground text-[10px] mb-2">Minimum ₹50 · Cannot exceed available balance</p>
                  <input
                    type="number"
                    placeholder="e.g. 200"
                    value={withdrawAmount}
                    onChange={(e) => {
                      setWithdrawAmount(e.target.value);
                      if (withdrawErrors.amount) setWithdrawErrors((p) => ({ ...p, amount: undefined }));
                    }}
                    className="input-gaming w-full px-4 py-3 text-sm font-mono"
                  />
                  {withdrawErrors.amount && <p className="text-danger text-xs mt-1">{withdrawErrors.amount}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">UPI ID / Number</label>
                  <p className="text-muted-foreground text-[10px] mb-2">Enter Google Pay, PhonePe, or Paytm UPI ID/Number (e.g. 9876543210@paytm)</p>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210@paytm / ybl / okaxis"
                    value={withdrawUpi}
                    onChange={(e) => {
                      setWithdrawUpi(e.target.value);
                      if (withdrawErrors.upiId) setWithdrawErrors((p) => ({ ...p, upiId: undefined }));
                    }}
                    className="input-gaming w-full px-4 py-3 text-sm font-mono"
                  />
                  {withdrawErrors.upiId && <p className="text-danger text-xs mt-1">{withdrawErrors.upiId}</p>}
                </div>

                <button
                  type="submit"
                  disabled={withdrawSubmitting || availableBalance <= 0}
                  className="w-full py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.08))',
                    border: '1px solid rgba(0,212,255,0.4)',
                    color: 'var(--neon-cyan)',
                  }}
                >
                  {withdrawSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <SendHorizonal className="w-4 h-4" />
                      Confirm Withdrawal
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {tab === 'join' && matchId && (
            <div className="space-y-5 text-center py-4">
              <div className="p-4 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Tournament Entry Fee</p>
                <p className="text-3xl font-bold text-neon-cyan font-mono my-2">₹{entryFee}</p>
                <p className="text-xs text-muted-foreground">This amount will be automatically deducted from your wallet balance upon joining.</p>
              </div>

              <button
                type="button"
                onClick={handleJoinTournament}
                disabled={joining}
                className="w-full py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.1))',
                  border: '1px solid rgba(0,255,136,0.4)',
                  color: 'var(--neon-green)',
                }}
              >
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Join Match'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}