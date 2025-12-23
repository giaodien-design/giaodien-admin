'use client';

import * as React from 'react';
import { Switch } from '@/components/ui/switch';
import { IconStarFilled } from '@tabler/icons-react';
import { toast } from 'sonner';

interface RecommendationToggleProps {
  id: string;
  isRecommended: boolean;
  onToggle: (id: string, isRecommended: boolean) => Promise<{ success: boolean; error?: string }>;
  label?: string;
}

export function RecommendationToggle({ id, isRecommended, onToggle, label }: RecommendationToggleProps) {
  const [checked, setChecked] = React.useState(isRecommended);
  const [isPending, setIsPending] = React.useState(false);

  const handleToggle = async (newValue: boolean) => {
    setIsPending(true);
    // Optimistic update
    setChecked(newValue);

    try {
      const result = await onToggle(id, newValue);
      
      if (result.success) {
        toast.success(newValue ? 'Added to recommendations' : 'Removed from recommendations');
      } else {
        // Revert on error
        setChecked(!newValue);
        toast.error(result.error || 'Failed to update recommendation');
      }
    } catch (error) {
      // Revert on error
      setChecked(!newValue);
      toast.error('Failed to update recommendation');
      console.error('Toggle recommendation error:', error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Switch
        checked={checked}
        onCheckedChange={handleToggle}
        disabled={isPending}
        aria-label={label || 'Toggle recommendation'}
      />
      {checked && (
        <IconStarFilled className="h-4 w-4 text-yellow-500" />
      )}
    </div>
  );
}

