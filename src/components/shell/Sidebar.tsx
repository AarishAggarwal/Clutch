"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import MaterialIcon from "@/components/shell/MaterialIcon";

type NavItem = { href: string; label: string; icon: string };

const studentMain: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/universities", label: "University List", icon: "account_balance" },
  { href: "/essays", label: "Essays", icon: "description" },
  { href: "/profile", label: "Profile", icon: "person" },
];

const studentResources: NavItem[] = [
  { href: "/application-preview", label: "Preview", icon: "preview" },
  { href: "/activities", label: "Activities", icon: "groups" },
  { href: "/chat", label: "Messages", icon: "chat" },
  { href: "/locker", label: "Locker", icon: "folder" },
  { href: "/scholarships", label: "Scholarships", icon: "school" },
  { href: "/marketplace", label: "Marketplace", icon: "storefront" },
  { href: "/documents", label: "Documents", icon: "article" },
];

const counselorNav: NavItem[] = [
  { href: "/counselor/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/counselor/students", label: "Students", icon: "group" },
  { href: "/counselor/students/add", label: "Add student", icon: "person_add" },
  { href: "/counselor/settings", label: "Settings", icon: "settings" },
];

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active =
    pathname === item.href ||
    (item.href !== "/" && pathname.startsWith(item.href) && item.href !== "/counselor/students");
  const studentsActive = item.href === "/counselor/students" && pathname.startsWith("/counselor/students") && !pathname.startsWith("/counselor/students/add");

  const isActive = item.href === "/counselor/students" ? studentsActive : active;

  return (
    <Link
      href={item.href}
      className={[
        "flex items-center gap-3 px-4 py-2 text-sm transition-all duration-200",
        isActive
          ? "scale-[0.98] border-l-2 border-primary-container bg-sidebar-active text-white"
          : "text-text-muted hover:bg-sidebar-active hover:text-white",
      ].join(" ")}
    >
      <MaterialIcon name={item.icon} className="text-[20px]" filled={isActive} />
      <span className="text-xs font-medium tracking-wide">{item.label}</span>
    </Link>
  );
}

export default function Sidebar({ role }: { role: "student" | "counselor" }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isCounselor = role === "counselor";
  const brandHref = isCounselor ? "/counselor/dashboard" : "/dashboard";

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 flex w-[240px] flex-col border-r border-white/10 bg-[#0D1117]">
      <div className="p-6">
        <Link href={brandHref} className="text-xl font-semibold tracking-tight text-white">
          Clutch
        </Link>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
          {isCounselor ? "Counsellor Portal" : "Student Portal"}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-0">
        {!isCounselor ? (
          <>
            <div className="mb-2 px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">Main Menu</div>
            {studentMain.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
            <div className="mb-2 mt-6 px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">Resources</div>
            {studentResources.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </>
        ) : (
          <>
            <div className="mb-2 px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">Main Menu</div>
            {counselorNav.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-lg bg-sidebar-active p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Signed in as</p>
          <p className="mt-1 truncate text-sm font-bold text-white">{session?.user?.name || session?.user?.email || "User"}</p>
          <button
            type="button"
            className="mt-3 w-full rounded-lg bg-primary-container py-2 text-[11px] font-bold text-white transition hover:brightness-110"
          >
            Upgrade to Pro
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 px-4 py-2 text-xs text-text-muted transition hover:text-white"
          >
            <MaterialIcon name="logout" className="!text-sm" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
