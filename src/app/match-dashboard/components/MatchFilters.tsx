'use client';
import React from 'react';
import { Swords, Zap, Settings, Trophy, Flame, Clock, CheckCircle } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


type FilterValue = 'All' | 'Classic' | 'Clash Squad' | 'Custom' | 'Battle Royale' | 'Registration Open' | 'Live' | 'Upcoming' | 'Completed';

interface MatchFiltersProps {
  activeFilter: FilterValue | string;
  onFilter: (f: FilterValue) => void;
}

const FILTERS: { label: FilterValue; icon: React.ElementType; color: string }[] = [
  { label: 'All', icon: Trophy, color: 'text-neon-cyan' },
  { label: 'Registration Open', icon: CheckCircle, color: 'text-neon-green' },
  { label: 'Live', icon: Flame, color: 'text-neon-orange' },
  { label: 'Upcoming', icon: Clock, color: 'text-neon-cyan' },
  { label: 'Classic', icon: Swords, color: 'text-neon-purple' },
  { label: 'Clash Squad', icon: Zap, color: 'text-neon-orange' },
  { label: 'Custom', icon: Settings, color: 'text-foreground' },
];

export default function MatchFilters({ activeFilter, onFilter }: MatchFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => {
        const Icon = f.icon;
        const isActive = activeFilter === f.label;
        return (
          <button
            key={`filter-${f.label}`}
            onClick={() => onFilter(f.label)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-semibold tracking-wider transition-all duration-200 ${
              isActive
                ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/50 shadow-[0_0_10px_rgba(0,212,255,0.2)]'
                : 'bg-muted/50 text-muted-foreground border border-border hover:border-neon-cyan/30 hover:text-foreground'
            }`}
          >
            <Icon size={12} className={isActive ? 'text-neon-cyan' : f.color} />
            {f.label}
          </button>
        );
      })}
    </div>
  );
}