'use client';

import { usePathname } from 'next/navigation';
import { type Icon } from '@tabler/icons-react';
import Link from 'next/link';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';

export function NavMain({
  items
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}) {
  const pathname = usePathname();

  // Check if a nav item is active
  const isItemActive = (itemUrl: string): boolean => {
    if (itemUrl === '#') return false;
    
    // Exact match
    if (pathname === itemUrl) return true;
    
    // For root '/', only match exactly (not /apps, /flows, etc.)
    if (itemUrl === '/') return pathname === '/';
    
    // For other routes, check if pathname starts with the URL
    // This handles nested routes like /apps/123/edit
    return pathname.startsWith(itemUrl + '/') || pathname === itemUrl;
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = isItemActive(item.url);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title} asChild isActive={isActive}>
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
