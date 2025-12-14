'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconX, IconPhoto, IconPlus } from '@tabler/icons-react';

export interface ScreenUpload {
  id: string;
  file?: File;
  imageUrl: string;
  title: string;
  description?: string;
  flowId?: string;
  preview: string;
  uploading: boolean;
  error?: string;
}

interface MultiImageUploadProps {
  onScreensChange: (screens: ScreenUpload[]) => void;
  maxFiles?: number;
  flows?: Array<{ id: string; name: string }>;
}

export function MultiImageUpload({ onScreensChange, maxFiles = 20, flows = [] }: MultiImageUploadProps) {
  const [screens, setScreens] = useState<ScreenUpload[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Check max files limit
    if (screens.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} screens allowed`);
      return;
    }

    const newScreens: ScreenUpload[] = [];

    for (const file of files) {
      // Validate file
      if (!file.type.startsWith('image/')) {
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Max 5MB per image.`);
        continue;
      }

      // Create preview
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const screenId = `temp-${Date.now()}-${Math.random()}`;
      newScreens.push({
        id: screenId,
        file,
        imageUrl: '',
        title: file.name.replace(/\.[^/.]+$/, ''),
        preview,
        uploading: false
      });
    }

    const updatedScreens = [...screens, ...newScreens];
    setScreens(updatedScreens);
    onScreensChange(updatedScreens);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (id: string) => {
    const updatedScreens = screens.filter((s) => s.id !== id);
    setScreens(updatedScreens);
    onScreensChange(updatedScreens);
  };

  const handleUpdateScreen = (id: string, updates: Partial<ScreenUpload>) => {
    const updatedScreens = screens.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setScreens(updatedScreens);
    onScreensChange(updatedScreens);
  };

  const uploadScreen = async (screen: ScreenUpload) => {
    if (!screen.file) return;

    handleUpdateScreen(screen.id, { uploading: true, error: undefined });

    try {
      const formData = new FormData();
      formData.append('file', screen.file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      handleUpdateScreen(screen.id, {
        imageUrl: data.url,
        uploading: false
      });
    } catch (err) {
      handleUpdateScreen(screen.id, {
        uploading: false,
        error: err instanceof Error ? err.message : 'Upload failed'
      });
    }
  };

  const uploadAllScreens = async () => {
    const screensToUpload = screens.filter((s) => s.file && !s.imageUrl);
    await Promise.all(screensToUpload.map((s) => uploadScreen(s)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>
          Screen Images ({screens.length}/{maxFiles})
        </Label>
        {screens.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={uploadAllScreens}
            disabled={screens.every((s) => s.imageUrl || s.uploading)}
          >
            Upload All
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        id="multi-image-upload"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {screens.map((screen) => (
          <div key={screen.id} className="border rounded-lg p-4 space-y-3 relative">
            {/* Remove button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={() => handleRemove(screen.id)}
            >
              <IconX className="h-4 w-4" />
            </Button>

            {/* Image preview */}
            <div className="w-full aspect-[9/16] rounded-lg overflow-hidden bg-muted">
              <img src={screen.preview} alt={screen.title} className="w-full h-full object-cover" />
            </div>

            {/* Title input */}
            <div className="space-y-1.5">
              <Label htmlFor={`title-${screen.id}`} className="text-xs">
                Screen Title *
              </Label>
              <Input
                id={`title-${screen.id}`}
                value={screen.title}
                onChange={(e) => handleUpdateScreen(screen.id, { title: e.target.value })}
                placeholder="e.g., Login Screen"
                required
              />
            </div>

            {/* Description input */}
            <div className="space-y-1.5">
              <Label htmlFor={`desc-${screen.id}`} className="text-xs">
                Description
              </Label>
              <Input
                id={`desc-${screen.id}`}
                value={screen.description || ''}
                onChange={(e) => handleUpdateScreen(screen.id, { description: e.target.value })}
                placeholder="Brief description..."
              />
            </div>

            {/* Flow selection */}
            {flows.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor={`flow-${screen.id}`} className="text-xs">
                  Flow (optional)
                </Label>
                <Select
                  value={screen.flowId || ''}
                  onValueChange={(value) =>
                    handleUpdateScreen(screen.id, {
                      flowId: value || undefined
                    })
                  }
                >
                  <SelectTrigger id={`flow-${screen.id}`}>
                    <SelectValue placeholder="Select a flow" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Flow</SelectItem>
                    {flows.map((flow) => (
                      <SelectItem key={flow.id} value={flow.id}>
                        {flow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Upload status */}
            {screen.uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
            {screen.imageUrl && <p className="text-xs text-green-600">✓ Uploaded</p>}
            {screen.error && <p className="text-xs text-destructive">{screen.error}</p>}

            {/* Upload button */}
            {!screen.imageUrl && !screen.uploading && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={() => uploadScreen(screen)}
              >
                Upload to S3
              </Button>
            )}
          </div>
        ))}

        {/* Add more button */}
        {screens.length < maxFiles && (
          <label
            htmlFor="multi-image-upload"
            className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors min-h-[200px]"
          >
            <IconPhoto className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-1">Add Screens</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, WebP up to 5MB</p>
            <IconPlus className="h-5 w-5 text-muted-foreground mt-2" />
          </label>
        )}
      </div>

      {screens.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No screens added yet. Click above to add screen images.
        </p>
      )}
    </div>
  );
}
