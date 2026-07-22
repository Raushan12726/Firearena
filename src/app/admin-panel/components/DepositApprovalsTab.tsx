'use client';
import { useEffect, useState } from 'react';
// Centralized Supabase client import karein
import { supabase } from '@/lib/supabaseClient';

export default function DepositApprovalsTab() {
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
      .select('*')
      .in('status', ['Pending', 'pending']);

    if (transData) {
      combinedData = [...combinedData, ...transData.map(item => ({ ...item, sourceTable: 'transactions' }))];
    }

    const { data: withdrawData } = await supabase
      .from('withdrawals')
      .select('*')
      .in('status', ['Pending', 'pending']);

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
    
    let rowId = item.id || item._id || item.transaction_id || item.sno || item.uuid;
    let primaryKeyColumn = item.id ? 'id' : item._id ? '_id' : item.transaction_id ? 'transaction_id' : item.sno ? 'sno' : 'uuid';

    if (!rowId) {
      console.error("Debugging Item Data (No ID found):", item);
      alert('Error: Row ID not found for this item. Please check console (F12).');
      return;
    }

    // Agar Status 'Approved' kiya ja raha hai aur yeh Deposit hai
    if (newStatus === 'Approved' && sourceTable === 'transactions') {
      const userId = item.user_id;
      const amount = Number(item.amount || 0);

      if (!userId) {
        alert('Error: User ID missing in this transaction.');
        return;
      }

      // Supabase RPC function call karein balance update karne ke liye
      const { error: rpcError } = await supabase.rpc('approve_deposit', {
        p_transaction_id: rowId,
        p_user_id: userId,
        p_amount: amount
      });

      if (rpcError) {
        console.error("RPC Error:", rpcError.message);
        
        // Fallback: Agar RPC function nahi bani hai toh normal update try karein
        const { data: profileData } = await supabase
          .from('profiles')
          .select('wallet_balance')
          .eq('id', userId)
          .single();

        const currentBalance = Number(profileData?.wallet_balance || 0);
        const updatedBalance = currentBalance + amount;

        await supabase
          .from('profiles')
          .update({ wallet_balance: updatedBalance })
          .eq('id', userId);

        const { error: transError } = await supabase
          .from('transactions')
          .update({ status: 'Approved', approved_at: new Date().toISOString() })
          .eq(primaryKeyColumn, rowId);

        if (transError) {
          alert('Failed to approve: ' + transError.message);
          return;
        }
      }

      alert('Deposit approved and balance added successfully!');
      fetchAllRequests();
      return;
    }

    // Baaki cases (Withdrawal ya Rejection) ke liye normal update
    const updatePayload: any = { 
      status: newStatus,
      approved_at: new Date().toISOString() 
    };

    const { error } = await supabase
      .from(sourceTable)
      .update(updatePayload)
      .eq(primaryKeyColumn, rowId);

    if (error) {
      alert('Failed to update status: ' + error.message);
      return;
    }

    alert(`Request marked as ${newStatus} successfully!`);
    fetchAllRequests();
  };

  const filteredRequests = requests.filter((item) => {
    const type = (item.type || '').toLowerCase();
    if (filterType === 'Deposit') return type.includes('deposit') || type.includes('add') || item.sourceTable === 'transactions';
    if (filterType === 'Withdrawal') return type.includes('withdraw') || item.sourceTable === 'withdrawals';
    return true;
  });

  return (
    <div className="p-6 text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-display font-bold tracking-wider text-neon-orange">
            PAYMENT & WITHDRAWAL APPROVALS
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
            const isWithdrawal = item.sourceTable === 'withdrawals' || (item.type || '').toLowerCase().includes('withdraw');
            const uniqueKey = `${item.sourceTable || 'req'}-${item.id || item._id || item.sno || item.utrId || index}`;
            return (
              <div
                key={uniqueKey}
                className="bg-card border border-border p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      isWithdrawal ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {isWithdrawal ? 'Withdrawal' : 'Deposit'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      <b>Requested At:</b> {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent'}
                    </span>
                    {item.approved_at && (
                      <span className="text-xs text-green-400">
                        • <b>Approved At:</b> {new Date(item.approved_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold"><b>Player:</b> {item.playerName || item.player_name || item.username || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">
                    <b>{isWithdrawal ? 'UPI ID:' : 'UTR / Ref ID:'}</b> {item.upild || item.upi_id || item.utrId || item.utrid || item.reference_id || 'N/A'}
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