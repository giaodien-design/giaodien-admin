'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon } from 'lucide-react';

type PrimaryTabsProps = {
  onOpenSearch: () => void;
};

export function PrimaryTabs({ onOpenSearch }: PrimaryTabsProps) {
  const router = useRouter();

  const base = 'rounded-[12px] h-[43px] px-4 text-sm';

  return (
    <div className="hidden sm:flex items-center gap-2 h-[51px]">
      <Button
        variant="secondary"
        className={`${base} bg-[color:var(--color-ink)]/3 hover:bg-[color:var(--color-ink)]/6`}
        onClick={() => router.push('/apps')}
      >
        Ứng dụng
      </Button>
      <Button
        variant="secondary"
        className={`${base} bg-[color:var(--color-ink)]/3 hover:bg-[color:var(--color-ink)]/6`}
        onClick={() => router.push('/apps')}
      >
        Màn hình
      </Button>
      <Button
        variant="secondary"
        className={`${base} bg-[color:var(--color-ink)]/3 hover:bg-[color:var(--color-ink)]/6 flex items-center gap-2`}
        onClick={onOpenSearch}
      >
        <SearchIcon className="size-4" />
        Tìm kiếm
      </Button>
    </div>
  );
}
