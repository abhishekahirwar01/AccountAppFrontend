"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";

import {
  LayoutGrid,
  ArrowRightLeft,
  Package,
  FileBarChart2,
  ChevronDown,
  LogOut,
  Loader2,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getCurrentUser, logout } from "@/lib/auth";
import type { User } from "@/lib/types";
import { useUserPermissions } from "@/contexts/user-permissions-context"; // 👈 user-level caps
import { useSidebar } from "@/components/ui/sidebar";

export default function UserSidebar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { permissions: userCaps, isLoading } = useUserPermissions();
  const { isMobile, setOpenMobile } = useSidebar();

  const roleLower = (currentUser?.role ?? "").toLowerCase();
  const dashboardHref =
    roleLower === "admin" ? "/admin/dashboard" : "/user-dashboard";

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  // console.log("user / admin / manager Permissions :" , userCaps)

  const handleLogout = () => {
    const to = logout();
    window.location.assign(to);
  };

  const isActive = (path: string) => {
    if (pathname === path) return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const isReportsActive = isActive("/reports");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 flex items-center justify-between">
        {/* <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
            AccounTech Pro
          </h1>
        </div> */}
        <div className="flex items-center gap-2 justify-center">
                   <img src="/vinimaylogov.png" alt="Vinimay" className="md:h-[6vh] h-[5vh] w-auto object-cover" />
                    <img src="/vinimaylogotext.png" alt="Vinimay" className="md:h-[3vh] h-[2vh] mt-[3vh] ml-[-2vh] w-auto object-cover" />
                 </div>
      </SidebarHeader>

      <SidebarMenu className="flex-1 p-4 space-y-2">
        {/* Dashboard */}
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={isActive(dashboardHref)}
            tooltip="Dashboard"
          >
            <Link href={dashboardHref} onClick={() => isMobile && setOpenMobile(false)}>
              <LayoutGrid />
              <span>Dashboard</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {/* Transactions */}
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={isActive("/transactions")}
            tooltip="Transactions"
          >
            <Link href="/transactions" onClick={() => isMobile && setOpenMobile(false)}>
              <ArrowRightLeft />
              <span>Transactions</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {/* Inventory (user-level cap) */}
        {isLoading ? (
          <div className="flex items-center gap-2 p-2">
            <Loader2 className="h-4 w-4 animate-spin" /> <span>Loading...</span>
          </div>
        ) : (
          <>
            {userCaps?.canCreateInventory && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/inventory")}
                  tooltip="Inventory"
                >
                  <Link href="/inventory" onClick={() => isMobile && setOpenMobile(false)}>
                    <Package />
                    <span>Inventory</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </>
        )}

        {/* Reports */}
        {/* <Collapsible defaultOpen={isReportsActive}>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                className="w-full justify-between"
                isActive={isReportsActive}
                tooltip="Reports"
              >
                <div className="flex items-center gap-2">
                  <FileBarChart2 />
                  <span>Reports</span>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
          </SidebarMenuItem>
          <CollapsibleContent>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  asChild
                  isActive={isActive("/reports/profit-loss")}
                >
                  <Link href="/reports/profit-loss">Profit &amp; Loss</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  asChild
                  isActive={isActive("/reports/balance-sheet")}
                >
                  <Link href="/reports/balance-sheet">Balance Sheet</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible> */}
      </SidebarMenu>

      {currentUser && (
        <div className="p-4 space-y-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={currentUser?.avatar}
                alt={`@${currentUser?.name}`}
              />
              <AvatarFallback>{currentUser?.initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{currentUser?.name}</p>
              <p className="text-xs text-muted-foreground">
                {currentUser?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      )}
    </Sidebar>
  );
}
