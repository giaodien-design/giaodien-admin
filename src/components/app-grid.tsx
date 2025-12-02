import * as React from "react";

type AppItem = {
  id: string | number;
  title: string;
  subtitle: string;
};

type AppGridProps = {
  items: AppItem[];
};

export function AppGrid({ items }: AppGridProps) {
  return (
    <div className="w-full px-5 sm:px-20">
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4 sm:gap-x-6">
        {items.map((it) => (
          <div key={it.id} className="w-[187px] sm:w-[362px]">
            <div className="h-[53px] sm:h-[53px]">
              <div className="text-[15px] leading-6 line-clamp-1">{it.title}</div>
              <div className="text-[13px] text-muted-foreground leading-5 line-clamp-1">{it.subtitle}</div>
            </div>
            <div className="mt-[24px] sm:mt-[24px]">
              <div className="mx-[16px] sm:mx-[24px] rounded-[20px] sm:rounded-[24px] bg-[color:var(--color-ink)]/8 aspect-[314/680] sm:w-[314px] sm:h-[680px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


