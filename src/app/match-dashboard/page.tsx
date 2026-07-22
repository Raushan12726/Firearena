'use client';

import { WalletProvider } from './components/WalletContext';
import MatchDashboardContent from './components/MatchDashboardContent';

export default function MatchDashboardPage() {
  return (
    <WalletProvider>
      <MatchDashboardContent />
    </WalletProvider>
  );
}