'use client';

import * as React from 'react';
import {
  IconApps,
  IconDashboard,
  IconInnerShadowTop,
  IconSettings,
  IconGitBranch,
  IconCategory,
  IconStack2,
  IconComponents
} from '@tabler/icons-react';

import { NavApps } from '@/components/nav-apps';
import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg'
  },
  navMain: [
    {
      title: 'Dashboard',
      url: '/',
      icon: IconDashboard
    },
    {
      title: 'All Apps',
      url: '/apps',
      icon: IconApps
    },
    {
      title: 'All Flows',
      url: '/flows',
      icon: IconGitBranch
    },
    {
      title: 'All Categories',
      url: '/categories',
      icon: IconCategory
    },
    {
      title: 'Screen Types',
      url: '/screen-types',
      icon: IconStack2
    },
    {
      title: 'UI Elements',
      url: '/ui-elements',
      icon: IconComponents
    }
  ],
  navClouds: [],
  navSecondary: [
    {
      title: 'Settings',
      url: '/settings',
      icon: IconSettings
    }
  ]
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="/">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">GiaoDien Admin</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Desktop/Tablet menu */}
        <div className="hidden md:block">
          <NavMain items={data.navMain} />
          {data.navClouds.length > 0 && <NavApps items={data.navClouds} />}
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </div>
        {/* Mobile drawer per Figma: centered actions */}
        <div className="md:hidden flex flex-col items-center justify-center gap-4 py-10">
          <a
            href="#"
            className="h-[43px] rounded-[12px] px-5 inline-flex items-center justify-center border bg-[color:var(--color-ink)]/3 hover:bg-[color:var(--color-ink)]/6"
          >
            Đăng nhập
          </a>
          <a
            href="#"
            className="h-[43px] rounded-[12px] px-5 inline-flex items-center justify-center border bg-[color:var(--color-ink)]/3 hover:bg-[color:var(--color-ink)]/6"
          >
            Chuyển sang tiếng Anh
          </a>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
