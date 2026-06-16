"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import RoleBar from "@/components/shell/RoleBar";
import Sidebar from "@/components/shell/Sidebar";
import TopBar from "@/components/shell/TopBar";

export function useShowAppShell() {
  const pathname = usePathname();
  return !(
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/specialist")
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const show = useShowAppShell();

  if (!show) {
    return <>{children}</>;
  }

  const role = pathname.startsWith("/counselor") || session?.user?.role === "counselor" ? "counselor" : "student";
  const portalRole = pathname.startsWith("/counselor") ? "counselor" : role;

  return (
    <>
      <React.Suspense fallback={<aside className="fixed bottom-0 left-0 top-0 z-40 w-[240px] bg-[#0D1117]" />}>
        <Sidebar role={portalRole} />
      </React.Suspense>
      <RoleBar role={portalRole} />
      <TopBar />
      <main className="ml-[240px] min-h-0 flex-1 overflow-hidden bg-background pt-[90px]">
        {children}
      </main>
    </>
  );
}
