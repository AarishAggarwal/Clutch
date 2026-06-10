"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import MaterialIcon from "@/components/shell/MaterialIcon";
import ThemeToggle from "@/components/ThemeToggle";

function breadcrumbLabel(pathname: string) {
  const map: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/universities": "University List",
    "/essays": "Essays",
    "/profile": "Profile",
    "/chat": "Messages",
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
  const { data: session } = useSession();
  const label = breadcrumbLabel(pathname);
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <header className="fixed left-[240px] right-0 top-[38px] z-40 flex h-[52px] items-center justify-between border-b border-border-subtle bg-surface px-8">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative hidden w-full max-w-md sm:block">
          <MaterialIcon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-text-muted"
          />
          <input
            type="text"
            placeholder="Search universities, essays, or tasks…"
            className="w-full rounded-lg border border-border-subtle bg-white py-1.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <nav className="flex items-center gap-2 text-sm text-text-secondary sm:hidden">
          <span>{label}</span>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className="p-2 text-text-muted transition hover:text-primary" aria-label="Notifications">
          <MaterialIcon name="notifications" />
        </button>
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
