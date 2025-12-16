'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { updateScreen, getAllScreenTypes, getAllUIElements } from '@/lib/actions';

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

interface Screen {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  screenTypeId?: string | null;
  screenType?: ScreenType | null;
  uiElements?: UIElement[];
}

interface ScreenEditDialogProps {
  screen: Screen;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScreenEditDialog({ screen, open, onOpenChange }: ScreenEditDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState(screen.title);
  const [description, setDescription] = useState(screen.description || '');
  const [selectedScreenTypeId, setSelectedScreenTypeId] = useState<string>(screen.screenTypeId || '');
  const [selectedUIElementIds, setSelectedUIElementIds] = useState<string[]>(
    screen.uiElements?.map((el) => el.id) || []
  );

  // Data from server
  const [screenTypes, setScreenTypes] = useState<ScreenType[]>([]);
  const [uiElements, setUIElements] = useState<UIElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load screen types and UI elements
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [screenTypesResult, uiElementsResult] = await Promise.all([getAllScreenTypes(), getAllUIElements()]);

        if (screenTypesResult.success && screenTypesResult.data) {
          setScreenTypes(screenTypesResult.data);
        }
        if (uiElementsResult.success && uiElementsResult.data) {
          setUIElements(uiElementsResult.data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      loadData();
      // Reset form state when dialog opens
      setTitle(screen.title);
      setDescription(screen.description || '');
      setSelectedScreenTypeId(screen.screenTypeId || '');
      setSelectedUIElementIds(screen.uiElements?.map((el) => el.id) || []);
    }
  }, [open, screen]);

  const handleUIElementToggle = (elementId: string, checked: boolean) => {
    setSelectedUIElementIds((prev) => (checked ? [...prev, elementId] : prev.filter((id) => id !== elementId)));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await updateScreen(screen.id, {
        title,
        description: description || null,
        screenTypeId: selectedScreenTypeId || null,
        uiElementIds: selectedUIElementIds
      });

      if (result.success) {
        onOpenChange(false);
        router.refresh();
      } else {
        alert(result.error || 'Failed to update screen');
      }
    } catch (error) {
      console.error('Failed to update screen:', error);
      alert(error instanceof Error ? error.message : 'Failed to update screen');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Screen</DialogTitle>
          <DialogDescription>Update screen details, type, and UI elements.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Screen Preview */}
            <div className="flex gap-4">
              <div className="w-20 h-36 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img src={screen.imageUrl} alt={screen.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Screen title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                  />
                </div>
              </div>
            </div>

            {/* Screen Type Select */}
            <div className="space-y-2">
              <Label>Screen Type</Label>
              <Select value={selectedScreenTypeId} onValueChange={setSelectedScreenTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a screen type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {screenTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Categorize this screen (e.g., Login, Home, Profile)
              </p>
            </div>

            {/* UI Elements Multi-Select */}
            <div className="space-y-2">
              <Label>UI Elements</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {uiElements.map((element) => (
                  <div key={element.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`ui-element-${element.id}`}
                      checked={selectedUIElementIds.includes(element.id)}
                      onCheckedChange={(checked) => handleUIElementToggle(element.id, checked as boolean)}
                    />
                    <label
                      htmlFor={`ui-element-${element.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {element.name}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Select UI elements present in this screen
              </p>
              {selectedUIElementIds.length > 0 && (
                <p className="text-xs text-primary">
                  {selectedUIElementIds.length} element{selectedUIElementIds.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoading}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

