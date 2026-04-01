import * as React from "react";

function iconClass(className?: string) {
  return ["h-4 w-4 shrink-0 stroke-[1.5]", className ?? ""].join(" ");
}

export function IconTarget({ className }: { className?: string }) {
  return (
    <svg className={iconClass(className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" strokeLinecap="round" />
    </svg>
  );
}

export function IconBuilding({ className }: { className?: string }) {
  return (
    <svg className={iconClass(className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path d="M4 20V8l8-4v16M4 12h2M20 20h-8V10h8v10z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMail({ className }: { className?: string }) {
  return (
    <svg className={iconClass(className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path d="M4 6h16v12H4z" strokeLinejoin="round" />
      <path d="m4 7 8 6 8-6" strokeLinecap="round" />
    </svg>
  );
}

export function IconCurrency({ className }: { className?: string }) {
  return (
    <svg className={iconClass(className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path d="M12 3v18M7 8h9.5a2.5 2.5 0 0 1 0 5H8a2.5 2.5 0 0 0 0 5h8.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={iconClass(className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path d="M5 12l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconReceipt({ className }: { className?: string }) {
  return (
    <svg className={iconClass(className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path d="M8 4h8v16l-2-1-2 1-2-1-2 1-2-1V4z" strokeLinejoin="round" />
      <path d="M10 9h4M10 13h4" strokeLinecap="round" />
    </svg>
  );
}

export function IconMapPin({ className }: { className?: string }) {
  return (
    <svg className={iconClass(className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10z" strokeLinejoin="round" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  );
}

export function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={iconClass(className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        d="M6 3h4l2 5-2 1a12 12 0 0 0 5 5l1-2 5 2v4a2 2 0 0 1-2 2C9.07 18 4 12.93 4 5a2 2 0 0 1 2-2z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconGlobe({ className }: { className?: string }) {
  return (
    <svg className={iconClass(className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a16 16 0 0 1 0 18M12 3a16 16 0 0 0 0 18" strokeLinecap="round" />
    </svg>
  );
}

export function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={iconClass(className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconHeart({ className }: { className?: string }) {
  return (
    <svg className={iconClass(className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        d="M12 21s-7-4.6-7-10a5 5 0 0 1 9.6-2 5 5 0 0 1 9.6 2c0 5.4-7 10-7 10z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSparkles({ className }: { className?: string }) {
  return (
    <svg className={iconClass(className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path d="M9 11V8l2 3-2 3v-3zm6 0V8l2 3-2 3v-3z" strokeLinejoin="round" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
    </svg>
  );
}
