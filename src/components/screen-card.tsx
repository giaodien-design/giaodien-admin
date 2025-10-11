"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ScreenCardProps {
  screen: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string;
    screenType: string | null;
    viewCount: number;
    likeCount: number;
  };
}

export function ScreenCard({ screen }: ScreenCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-[9/16] bg-muted relative group">
        <img
          src={screen.imageUrl}
          alt={screen.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open(screen.imageUrl, "_blank")}
          >
            View Full
          </Button>
        </div>
      </div>
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm truncate">{screen.title}</h3>
        {screen.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {screen.description}
          </p>
        )}
        {screen.screenType && (
          <Badge variant="outline" className="mt-2 text-xs">
            {screen.screenType}
          </Badge>
        )}
        <div className="flex gap-2 text-xs text-muted-foreground mt-2">
          <span>👁 {screen.viewCount}</span>
          <span>❤️ {screen.likeCount}</span>
        </div>
      </CardContent>
    </Card>
  );
}
