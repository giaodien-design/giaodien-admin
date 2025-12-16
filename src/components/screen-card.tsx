'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScreenEditDialog } from '@/components/screen-edit-dialog';
import { Pencil } from 'lucide-react';

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

interface Flow {
  id: string;
  name: string;
}

interface AppVersion {
  id: string;
  name: string;
  createdAt: Date;
  _count: {
    screens: number;
  };
}

interface ScreenCardProps {
  screen: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string;
    viewCount: number;
    likeCount: number;
    order?: number;
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

export function ScreenCard({ screen, flows = [], versions = [], showEditButton = true }: ScreenCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
    <Card className="overflow-hidden">
      <div className="aspect-[9/16] bg-muted relative group">
        <img src={screen.imageUrl} alt={screen.title} className="w-full h-full object-cover" />
        
        {/* App Version Badge Overlay */}
        <div className="absolute top-2 right-2 z-10">
          {screen.appVersion ? (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0.5 bg-black/60 backdrop-blur-sm text-white border-white/20 shadow-sm"
            >
              {screen.appVersion.name}
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0.5 bg-amber-500/80 backdrop-blur-sm text-white border-amber-600 shadow-sm"
            >
              No Ver
            </Badge>
          )}
        </div>

        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => window.open(screen.imageUrl, '_blank')}>
            View Full
          </Button>
          {showEditButton && (
            <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(true)}>
              <Pencil className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </div>
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm truncate">{screen.title}</h3>
        {screen.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{screen.description}</p>}

          {/* Flow Badge */}
          {screen.flow && (
            <Badge variant="default" className="mt-2 text-xs mr-1">
              {screen.flow.name}
            </Badge>
          )}

          {/* Screen Type Badge */}
          {screen.screenType && (
            <Badge variant="outline" className="mt-2 text-xs">
              {screen.screenType.name}
            </Badge>
          )}

          {/* UI Elements */}
          {screen.uiElements && screen.uiElements.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {screen.uiElements.slice(0, 3).map((element) => (
                <Badge key={element.id} variant="secondary" className="text-xs px-1.5 py-0">
                  {element.name}
                </Badge>
              ))}
              {screen.uiElements.length > 3 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  +{screen.uiElements.length - 3}
                </Badge>
              )}
            </div>
          )}

        <div className="flex gap-2 text-xs text-muted-foreground mt-2">
          <span>👁 {screen.viewCount}</span>
          <span>❤️ {screen.likeCount}</span>
        </div>
      </CardContent>
    </Card>

      {showEditButton && (
        <ScreenEditDialog screen={screen} flows={flows} versions={versions} open={isEditOpen} onOpenChange={setIsEditOpen} />
      )}
    </>
  );
}
