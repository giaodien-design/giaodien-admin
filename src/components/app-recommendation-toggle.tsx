'use client';

import { toggleAppRecommendation } from '@/lib/actions';
import { RecommendationToggle } from '@/components/recommendation-toggle';

interface AppRecommendationToggleProps {
  id: string;
  isRecommended: boolean;
  appName: string;
}

export function AppRecommendationToggle({ id, isRecommended, appName }: AppRecommendationToggleProps) {
  return (
    <RecommendationToggle
      id={id}
      isRecommended={isRecommended}
      onToggle={toggleAppRecommendation}
      label={`Toggle recommendation for ${appName}`}
    />
  );
}

