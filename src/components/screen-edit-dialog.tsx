'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconCheck, IconSelector, IconX } from '@tabler/icons-react';
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
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
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

interface Screen {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  sortOrder?: number;
  screenTypeId?: string | null;
  screenType?: ScreenType | null;
  flowId?: string | null;
  flow?: Flow | null;
  appVersionId?: string | null;
  appVersion?: AppVersion | null;
  uiElements?: UIElement[];
}

interface ScreenEditDialogProps {
  screen: Screen;
  flows: Flow[];
  versions?: AppVersion[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScreenEditDialog({ screen, flows, versions = [], open, onOpenChange }: ScreenEditDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState(screen.title);
  const [description, setDescription] = useState(screen.description || '');
  const [selectedScreenTypeId, setSelectedScreenTypeId] = useState<string>(screen.screenTypeId || '');
  const [selectedFlowId, setSelectedFlowId] = useState<string>(screen.flowId || '');
  const [selectedAppVersionId, setSelectedAppVersionId] = useState<string>(screen.appVersionId || '');
  const [sortOrder, setSortOrder] = useState<number>(screen.sortOrder || 0);
  const [selectedUIElementIds, setSelectedUIElementIds] = useState<string[]>(
    screen.uiElements?.map((el) => el.id) || []
  );

  // Multi-select combobox state
  const [uiElementsOpen, setUiElementsOpen] = useState(false);

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
      setSelectedFlowId(screen.flowId || '');
      setSelectedAppVersionId(screen.appVersionId || '');
      setSortOrder(screen.sortOrder || 0);
      setSelectedUIElementIds(screen.uiElements?.map((el) => el.id) || []);
    }
  }, [open, screen]);

  const handleUIElementSelect = (elementId: string) => {
    setSelectedUIElementIds((prev) =>
      prev.includes(elementId) ? prev.filter((id) => id !== elementId) : [...prev, elementId]
    );
  };

  const handleUIElementRemove = (elementId: string) => {
    setSelectedUIElementIds((prev) => prev.filter((id) => id !== elementId));
  };

  const getSelectedUIElements = () => {
    return uiElements.filter((el) => selectedUIElementIds.includes(el.id));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await updateScreen(screen.id, {
        title,
        description: description || null,
        screenTypeId: selectedScreenTypeId || null,
        flowId: selectedFlowId || null,
        appVersionId: selectedAppVersionId || null,
        sortOrder,
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
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Screen</DialogTitle>
          <DialogDescription>Update screen details, type, flow assignment, and UI elements.</DialogDescription>
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

            {/* Flow Assignment & Sort Order */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Assign to Flow</Label>
                <Select
                  value={selectedFlowId || '__none__'}
                  onValueChange={(val) => setSelectedFlowId(val === '__none__' ? '' : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a flow (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No Flow</SelectItem>
                    {flows.map((flow) => (
                      <SelectItem key={flow.id} value={flow.id}>
                        {flow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Group this screen into a user flow</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">Position in flow</p>
              </div>
            </div>

            {/* Screen Type Select */}
            <div className="space-y-2">
              <Label>Screen Type</Label>
              <Select
                value={selectedScreenTypeId || '__none__'}
                onValueChange={(val) => setSelectedScreenTypeId(val === '__none__' ? '' : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a screen type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {screenTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Categorize this screen (e.g., Login, Home, Profile)</p>
            </div>

            {/* App Version Select */}
            <div className="space-y-2">
              <Label>App Version</Label>
              <Select
                value={selectedAppVersionId || '__none__'}
                onValueChange={(val) => setSelectedAppVersionId(val === '__none__' ? '' : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an app version (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {versions.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      {version.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Assign this screen to a specific app version</p>
            </div>

            {/* UI Elements Multi-Select Combobox */}
            <div className="space-y-2">
              <Label>UI Elements</Label>

              {/* Selected Elements as Badges */}
              {selectedUIElementIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {getSelectedUIElements().map((element) => (
                    <Badge key={element.id} variant="secondary" className="pr-1 gap-1">
                      {element.name}
                      <button
                        type="button"
                        className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                        onClick={() => handleUIElementRemove(element.id)}
                      >
                        <IconX className="size-3" />
                        <span className="sr-only">Remove {element.name}</span>
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Combobox Trigger */}
              <Popover open={uiElementsOpen} onOpenChange={setUiElementsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={uiElementsOpen}
                    className="w-full justify-between font-normal"
                  >
                    {selectedUIElementIds.length > 0
                      ? `${selectedUIElementIds.length} element${selectedUIElementIds.length !== 1 ? 's' : ''} selected`
                      : 'Search and select UI elements...'}
                    <IconSelector className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search UI elements..." />
                    <CommandList>
                      <CommandEmpty>No UI element found.</CommandEmpty>
                      <CommandGroup>
                        {uiElements.map((element) => (
                          <CommandItem
                            key={element.id}
                            value={element.name}
                            onSelect={() => handleUIElementSelect(element.id)}
                          >
                            <div
                              className={cn(
                                'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                selectedUIElementIds.includes(element.id)
                                  ? 'bg-primary text-primary-foreground'
                                  : 'opacity-50 [&_svg]:invisible'
                              )}
                            >
                              <IconCheck className="size-3" />
                            </div>
                            {element.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">Select UI elements present in this screen</p>
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
