'use client';
import { useEffect, useState } from 'react';
// Centralized Supabase client import karein
import { supabase } from '@/lib/supabaseClient';

export default function WalletApprovalsTab() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'All' | 'Deposit' | 'Withdrawal'>('All');

  useEffect(() => {
    fetchAllRequests();
  }, []);

  const fetchAllRequests = async () => {
    setLoading(true);
    let combinedData: any[] = [];

    const { data: transData } = await supabase
      .from('transactions')
      .select('*');

    if (transData) {
      combinedData = [
        ...combinedData, 
        ...transData.map(item => ({ 
          ...item, 
          type: 'Deposit', 
          sourceTable: 'transactions' 
        }))
      ];
    }

    const { data: withdrawData } = await supabase
      .from('withdrawals')
      .select('*');

    if (withdrawData) {
      const formattedWithdrawals = withdrawData.map(item => ({
        ...item,
        type: 'Withdrawal',
        sourceTable: 'withdrawals'
      }));
      combinedData = [...combinedData, ...formattedWithdrawals];
    }

    setRequests(combinedData);
    setLoading(false);
  };

  const handleUpdateStatus = async (item: any, newStatus: string) => {
    const sourceTable = item.sourceTable;
    const rowId = item.id;
    const amount = Number(item.amount || 0);
    // Yaha check karein ki user_id kaunse column me save hai (user_id, userId, ya player_id)
    const userId = item.user_id || item.userId || item.player_id;

    console.log("Processing item:", item);
    console.log("Extracted User ID:", userId);

    if (rowId === undefined || rowId === null) {
      alert('Error: Row ID not found for this item.');
      return;
    }

    // 1. Status Update Karein
    const { error } = await supabase
      .from(sourceTable)
      .update({ status: newStatus })
      .eq('id', rowId);

    if (error) {
      alert('Failed to update status: ' + error.message);
      return;
    }

    // 2. Agar Deposit/Transaction Approved ho jaye, toh Balance Add Karein
    if (sourceTable === 'transactions' && newStatus === 'Approved') {
      if (!userId) {
        console.warn("User ID missing in transaction row, cannot update balance automatically.");
      } else {
        // Aapke profiles table ya users table se balance fetch karein
        const { data: profile, error: profileError } = await supabase
          .from('profiles') // Agar table ka naam 'users' hai toh yahan 'users' kar dein
          .select('balance')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error("Error fetching profile balance:", profileError.message);
        } else {
          const currentBalance = Number(profile?.balance || 0);
          const newBalance = currentBalance + amount;

          const { error: updateError } = await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', userId);

          if (updateError) {
            console.error("Error updating balance:", updateError.message);
          } else {
            console.log("Balance updated successfully to:", newBalance);
          }
        }
      }
    }

    // 3. Agar Withdrawal Rejected ho jaye, toh paise wapas refund karein
    if (sourceTable === 'withdrawals' && newStatus === 'Rejected' && userId) {
      const { data: profile } = await supabase.from('profiles').select('balance').eq('id', userId).single();
      const currentBalance = Number(profile?.balance || 0);
      await supabase.from('profiles').update({ balance: currentBalance + amount }).eq('id', userId);
    }

    alert(`Request marked as ${newStatus} successfully!`);
    fetchAllRequests();
  };

  const pendingCount = requests.filter(item => (item.status || '').toLowerCase() === 'pending').length;
  
  const approvedTotalAmount = requests
    .filter(item => {
      const st = (item.status || '').toLowerCase();
      return st === 'approved' || st === 'success';
    })
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const rejectedCount = requests.filter(item => (item.status || '').toLowerCase() === 'rejected').length;

  const filteredRequests = requests.filter((item) => {
    const status = (item.status || '').toLowerCase();
    const type = (item.type || '').toLowerCase();
    
    if (status !== 'pending') return false; 

    if (filterType === 'Deposit') return type.includes('deposit') || item.sourceTable === 'transactions';
    if (filterType === 'Withdrawal') return type.includes('withdrawal') || item.sourceTable === 'withdrawals';
    return true;
  });

  return (
    <div className="p-6 text-white">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border p-4 rounded-xl">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pending Approvals</p>
          <h3 className="text-2xl font-bold font-display text-neon-orange">{pendingCount}</h3>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Approved Total</p>
          <h3 className="text-2xl font-display font-bold text-green-400">₹{approvedTotalAmount}</h3>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Rejected</p>
          <h3 className="text-2xl font-display font-bold text-red-400">{rejectedCount}</h3>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-display font-bold tracking-wider text-neon-orange">
            WALLET & WITHDRAWAL APPROVALS
          </h2>
          <p className="text-sm text-muted-foreground">Manage user deposit proofs and withdrawal requests</p>
        </div>
        <button
          onClick={fetchAllRequests}
          className="px-4 py-2 bg-muted/40 hover:bg-muted border border-border rounded-lg text-xs font-semibold transition-colors"
        >
          Refresh Data
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {(['All', 'Deposit', 'Withdrawal'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-display font-semibold transition-all ${
              filterType === tab
                ? 'bg-neon-orange/20 text-neon-orange border border-neon-orange/40'
                : 'bg-card text-muted-foreground border border-border hover:text-foreground'
            }`}
          >
            {tab} Requests
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground animate-pulse">Loading requests...</p>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-card border border-border p-8 rounded-xl text-center">
          <p className="text-muted-foreground">No pending {filterType.toLowerCase()} requests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((item, index) => {
            const isWithdrawal = item.sourceTable === 'withdrawals' || (item.type || '').toLowerCase().includes('withdrawal');
            const referenceId = item.utrId || item.utrid || item.upiId || item.upild || item.reference_id || 'N/A';
            
            return (
              <div
                key={`${item.sourceTable}-${item.id || index}`}
                className="bg-card border border-border p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      isWithdrawal ? 'bg-orange-500/20` text-orange-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {isWithdrawal ? 'Withdrawal' : 'Deposit'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold"><b>Player:</b> {item.playerName || item.username || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">
                    <b>{isWithdrawal ? 'UPI ID:' : 'UTR / Ref ID:'}</b> {referenceId}
                  </p>
                  <p className="text-base font-bold text-foreground"><b>Amount:</b> ₹{item.amount}</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <button
                    onClick={() => handleUpdateStatus(item, 'Approved')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition-colors flex-1 md:flex-none"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(item, 'Rejected')}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold transition-colors flex-1 md:flex-none"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}