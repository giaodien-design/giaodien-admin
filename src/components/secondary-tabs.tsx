"use client";

import * as React from "react";

const TABS = ["Tất cả", "Di chuyển", "Tài chính", "Giải trí", "Đời sống"] as const;

type SecondaryTabsProps = {
  value?: string;
  onChange?: (value: string) => void;
};

export function SecondaryTabs({ value, onChange }: SecondaryTabsProps) {
  const [current, setCurrent] = React.useState<string>(value ?? TABS[0]);
  React.useEffect(() => {
    if (value) setCurrent(value);
  }, [value]);

  const handle = (v: string) => {
    setCurrent(v);
    onChange?.(v);
  };

  return (
    <div className="h-[83px] flex items-center">
      <div className="w-full px-5 sm:px-20 flex items-center gap-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => handle(t)}
            className={`h-[35px] text-sm whitespace-nowrap ${
              current === t ? "font-semibold" : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}


