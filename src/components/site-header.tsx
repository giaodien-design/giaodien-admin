'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { SearchSheet } from '@/components/search-sheet';
import { Search as SearchIcon } from 'lucide-react';

export function SiteHeader() {
  const [searchOpen, setSearchOpen] = React.useState(false);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-3 lg:px-6">
        {/* Sidebar Toggle */}
        <SidebarTrigger className="-ml-1" />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Desktop: Search button with text */}
        <Button
          variant="secondary"
          className="hidden sm:flex rounded-[12px] h-[43px] px-4 text-sm bg-[color:var(--color-ink)]/3 hover:bg-[color:var(--color-ink)]/6 items-center gap-2"
          onClick={() => setSearchOpen(true)}
        >
          <SearchIcon className="size-4" />
          Search
        </Button>

        {/* Mobile: Icon-only search button */}
        <Button
          size="icon"
          variant="secondary"
          className="sm:hidden rounded-xl bg-[color:var(--color-ink)]/3 hover:bg-[color:var(--color-ink)]/6"
          onClick={() => setSearchOpen(true)}
          aria-label="Open search"
        >
          <SearchIcon className="size-4" />
        </Button>
      </div>

      <SearchSheet open={searchOpen} onOpenChange={setSearchOpen} placeholder="Search apps, screens, and more" />
    </header>
  );
}
