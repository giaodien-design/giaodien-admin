'use client';

import { useState, useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { togglePremiumMode } from '@/lib/actions/settings';

interface PremiumModeToggleProps {
  initialValue: boolean;
}

export function PremiumModeToggle({ initialValue }: PremiumModeToggleProps) {
  const [isPremium, setIsPremium] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (checked: boolean) => {
    // Optimistic update
    setIsPremium(checked);

    startTransition(async () => {
      const result = await togglePremiumMode(!checked);

      if (!result.success) {
        // Revert on error
        setIsPremium(!checked);
        console.error('Failed to toggle premium mode');
      }
    });
  };

  return (
    <Switch
      checked={isPremium}
      onCheckedChange={handleToggle}
      disabled={isPending}
      aria-label="Toggle premium mode"
    />
  );
}
