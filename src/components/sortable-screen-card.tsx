'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScreenCard } from './screen-card';

interface Flow {
  id: string;
  name: string;
}

interface ScreenType {
  id: string;
  name: string;
  slug: string;
}

interface UIElement {
  id: string;
  name: string;
  slug: string;
}

interface AppVersion {
  id: string;
  name: string;
  createdAt: Date;
  _count: {
    screens: number;
  };
}

interface SortableScreenCardProps {
  screen: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string;
    viewCount: number;
    likeCount: number;
    sortOrder?: number;
    screenTypeId?: string | null;
    screenType?: ScreenType | null;
    flowId?: string | null;
    flow?: Flow | null;
    appVersionId?: string | null;
    appVersion?: AppVersion | null;
    uiElements?: UIElement[];
  };
  flows?: Flow[];
  versions?: AppVersion[];
  showEditButton?: boolean;
}

export function SortableScreenCard({ screen, flows, versions = [], showEditButton = true }: SortableScreenCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: screen.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'z-50 shadow-lg scale-105' : ''}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
        <ScreenCard screen={screen} flows={flows} versions={versions} showEditButton={showEditButton} />
      </div>
    </div>
  );
}
