"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationsDropdown from "@/components/shell/NotificationsDropdown";

function breadcrumbLabel(pathname: string, tab: string | null) {
  if (pathname.startsWith("/resources")) {
    return tab === "counselor" ? "4-Year Counselor" : "Essay Assistant";
  }
  const map: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/universities": "University List",
    "/essays": "Essays",
    "/profile": "Profile",
    "/resources": "Assistants",
    "/activities": "Activities",
    "/locker": "Locker",
    "/scholarships": "Scholarships",
    "/marketplace": "Marketplace",
    "/documents": "Documents",
    "/application-preview": "Preview",
    "/counselor/dashboard": "Dashboard",
    "/counselor/students": "Students",
    "/counselor/students/add": "Add student",
    "/counselor/settings": "Settings",
  };
  if (map[pathname]) return map[pathname];
  if (pathname.startsWith("/counselor/students/")) return "Student detail";
  if (pathname.startsWith("/universities/")) return "University";
  return "Clutch";
}

export default function TopBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const label = breadcrumbLabel(pathname, searchParams.get("tab"));
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <header className="fixed left-[240px] right-0 top-[38px] z-40 flex h-[52px] items-center justify-between border-b border-border-subtle bg-surface px-8">
      <div className="relative flex flex-1 items-center gap-4">
        <nav className="hidden items-center gap-2 text-sm font-medium text-text-primary sm:flex">
          <span>{label}</span>
        </nav>
        <nav className="flex items-center gap-2 text-sm text-text-secondary sm:hidden">
          <span>{label}</span>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <NotificationsDropdown />
        <ThemeToggle />
        <div className="hidden h-4 w-px bg-border-subtle sm:block" />
        <Link href={pathname.startsWith("/counselor") ? "/counselor/settings" : "/profile"} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border-subtle bg-surface-container-high text-xs font-bold text-primary">
            {(session?.user?.name?.[0] || session?.user?.email?.[0] || "U").toUpperCase()}
          </div>
          <span className="hidden text-sm font-bold text-primary sm:inline">{firstName}</span>
        </Link>
      </div>
    </header>
  );
}
