export interface Match {
  id: string;
  title: string;
  mode: 'Classic BR' | 'Clash Squad' | 'Lone Wolf' | 'Custom';
  map: string;
  status: 'live' | 'upcoming' | 'completed';
  entryFee: number;
  prizePool: number;
  totalSlots: number;
  filledSlots: number;
  scheduledAt: string;
  roomId?: string;
  roomPassword?: string;
  topKills?: number;
  registeredByUser?: boolean;
}

export const mockMatches: Match[] = [
  {
    id: 'match-001',
    title: 'Friday Night Booyah Blitz',
    mode: 'Classic BR',
    map: 'Bermuda',
    status: 'live',
    entryFee: 25,
    prizePool: 5000,
    totalSlots: 50,
    filledSlots: 50,
    scheduledAt: '2026-07-20T18:00:00',
    roomId: 'FF2026001',
    roomPassword: 'BLITZ25',
    registeredByUser: true,
  },
  {
    id: 'match-002',
    title: 'Sunday Clash Royale',
    mode: 'Clash Squad',
    map: 'Purgatory',
    status: 'upcoming',
    entryFee: 15,
    prizePool: 2500,
    totalSlots: 32,
    filledSlots: 24,
    scheduledAt: '2026-07-21T16:00:00',
  },
  {
    id: 'match-003',
    title: 'Lone Wolf Championship',
    mode: 'Lone Wolf',
    map: 'Kalahari',
    status: 'upcoming',
    entryFee: 50,
    prizePool: 10000,
    totalSlots: 50,
    filledSlots: 41,
    scheduledAt: '2026-07-21T20:00:00',
  },
  {
    id: 'match-004',
    title: 'Mid-Week Mayhem',
    mode: 'Classic BR',
    map: 'Alpine',
    status: 'upcoming',
    entryFee: 10,
    prizePool: 1000,
    totalSlots: 50,
    filledSlots: 50,
    scheduledAt: '2026-07-22T19:00:00',
  },
  {
    id: 'match-005',
    title: 'Pro League Season 3 — Qualifier',
    mode: 'Custom',
    map: 'Bermuda Remastered',
    status: 'upcoming',
    entryFee: 100,
    prizePool: 25000,
    totalSlots: 50,
    filledSlots: 38,
    scheduledAt: '2026-07-23T21:00:00',
  },
  {
    id: 'match-006',
    title: 'Thursday Kill Race',
    mode: 'Classic BR',
    map: 'Nexterra',
    status: 'completed',
    entryFee: 20,
    prizePool: 3000,
    totalSlots: 50,
    filledSlots: 50,
    scheduledAt: '2026-07-17T18:00:00',
    topKills: 22,
  },
  {
    id: 'match-007',
    title: 'Clash Squad Invitational',
    mode: 'Clash Squad',
    map: 'Purgatory',
    status: 'completed',
    entryFee: 30,
    prizePool: 4000,
    totalSlots: 32,
    filledSlots: 32,
    scheduledAt: '2026-07-18T15:00:00',
    topKills: 18,
  },
  {
    id: 'match-008',
    title: 'Weekend Warriors Cup',
    mode: 'Classic BR',
    map: 'Bermuda',
    status: 'live',
    entryFee: 35,
    prizePool: 7500,
    totalSlots: 50,
    filledSlots: 50,
    scheduledAt: '2026-07-20T19:30:00',
    roomId: 'FF2026008',
    roomPassword: 'WAR35',
  },
  {
    id: 'match-009',
    title: 'Kalahari Desert Storm',
    mode: 'Custom',
    map: 'Kalahari',
    status: 'upcoming',
    entryFee: 75,
    prizePool: 15000,
    totalSlots: 50,
    filledSlots: 12,
    scheduledAt: '2026-07-24T17:00:00',
  },
  {
    id: 'match-010',
    title: 'Newbie Friendly Cup',
    mode: 'Classic BR',
    map: 'Bermuda',
    status: 'upcoming',
    entryFee: 5,
    prizePool: 500,
    totalSlots: 50,
    filledSlots: 33,
    scheduledAt: '2026-07-22T14:00:00',
  },
];