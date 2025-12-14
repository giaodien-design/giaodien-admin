'use client';

import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon } from 'lucide-react';

interface SearchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
}

export function SearchSheet({ open, onOpenChange, placeholder = 'Search apps, data, and more' }: SearchSheetProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="top" className="p-0">
        <SheetHeader className="p-4 pb-0">
          <SheetTitle className="sr-only">Search</SheetTitle>
        </SheetHeader>
        <div className="p-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-12 text-base"
              autoFocus
            />
          </div>
          {/* Search results can be added here */}
          {searchQuery && (
            <div className="mt-4 text-sm text-muted-foreground">
              Search results for &quot;{searchQuery}&quot; will appear here
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
