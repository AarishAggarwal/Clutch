"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import MaterialIcon from "@/components/shell/MaterialIcon";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationsDropdown from "@/components/shell/NotificationsDropdown";

type SearchResult = {
  essays: Array<{ id: string; title: string; href: string }>;
  comments: Array<{ id: string; content: string; href: string }>;
  universities: Array<{ id: string; name: string; href: string }>;
};

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
  const router = useRouter();
  const { data: session } = useSession();
  const hideSearch = pathname.startsWith("/resources");
  const label = breadcrumbLabel(pathname, searchParams.get("tab"));
  const firstName = session?.user?.name?.split(" ")[0] || "there";
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult | null>(null);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const debounce = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    debounce.current = setTimeout(() => {
      void (async () => {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) setResults((await res.json()) as SearchResult);
      })();
    }, 300);
  }, [query]);

  return (
    <header className="fixed left-[240px] right-0 top-[38px] z-40 flex h-[52px] items-center justify-between border-b border-border-subtle bg-surface px-8">
      <div className="relative flex flex-1 items-center gap-4">
        {!hideSearch ? (
        <div className="relative hidden w-full max-w-md sm:block">
          <MaterialIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
            placeholder="Search essays, comments, universities…"
            className="input-base !py-1.5 !pl-10"
          />
          {searchOpen && results && query.trim().length >= 2 ? (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-border-subtle bg-elevated shadow-elevated">
              {results.essays.length > 0 ? (
                <div className="border-b border-border-subtle p-2">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase text-text-muted">Essays</div>
                  {results.essays.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-surface-container-high"
                      onMouseDown={() => router.push(e.href)}
                    >
                      {e.title}
                    </button>
                  ))}
                </div>
              ) : null}
              {results.comments.length > 0 ? (
                <div className="border-b border-border-subtle p-2">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase text-text-muted">Comments</div>
                  {results.comments.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-surface-container-high"
                      onMouseDown={() => router.push(c.href)}
                    >
                      {c.content.slice(0, 80)}
                    </button>
                  ))}
                </div>
              ) : null}
              {results.universities.length > 0 ? (
                <div className="p-2">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase text-text-muted">Universities</div>
                  {results.universities.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-surface-container-high"
                      onMouseDown={() => router.push(u.href)}
                    >
                      {u.name}
                    </button>
                  ))}
                </div>
              ) : null}
              {!results.essays.length && !results.comments.length && !results.universities.length ? (
                <p className="px-4 py-3 text-sm text-text-muted">No results.</p>
              ) : null}
            </div>
          ) : null}
        </div>
        ) : (
          <nav className="hidden items-center gap-2 text-sm font-medium text-text-primary sm:flex">
            <span>{label}</span>
          </nav>
        )}
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
