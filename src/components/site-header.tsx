"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SearchSheet } from "@/components/search-sheet";
import { Search as SearchIcon } from "lucide-react";
import { PrimaryTabs } from "@/components/primary-tabs";

export function SiteHeader() {
  const [searchOpen, setSearchOpen] = React.useState(false);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-3 lg:px-6">
        {/* 1st item: Hamburger */}
        <SidebarTrigger className="-ml-1" />

        {/* 2nd item: Divider */}
        <Separator orientation="vertical" className="mx-2 h-5" />

        {/* 3rd item: Primary tabs group with search */}
        <PrimaryTabs onOpenSearch={() => setSearchOpen(true)} />

        {/* Mobile: icon-only trigger to keep it third visually */}
        <Button
          size="icon"
          variant="secondary"
          className="sm:hidden rounded-xl bg-[color:var(--color-ink)]/3 hover:bg-[color:var(--color-ink)]/6"
          onClick={() => setSearchOpen(true)}
          aria-label="Open search"
        >
          <SearchIcon className="size-4" />
        </Button>

        {/* Spacer and title if needed */}
        <div className="ml-auto flex items-center gap-2">
          <h1 className="text-base font-medium" />
        </div>
      </div>

      <SearchSheet open={searchOpen} onOpenChange={setSearchOpen} placeholder="Search apps, data, and more" />
    </header>
  );
}
