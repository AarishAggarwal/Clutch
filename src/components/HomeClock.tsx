"use client";

import * as React from "react";

const DEFAULT_APPS_OPEN_AT_ISO = "2026-08-01T00:00:00-04:00";
const appsOpenAtIso = process.env.NEXT_PUBLIC_APPS_OPEN_AT ?? DEFAULT_APPS_OPEN_AT_ISO;
const APPS_OPEN_AT = new Date(appsOpenAtIso);

function formatTimeLeft(ms: number) {
  if (ms <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isOpen: true,
    };
  }

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, isOpen: false };
}

export default function HomeClock() {
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const timeLeft = formatTimeLeft(APPS_OPEN_AT.getTime() - now.getTime());
  const targetLabel = APPS_OPEN_AT.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div className="panel px-4 py-3 text-center">
      <div className="kpi-label">2026-27 cycle opens in</div>
      {timeLeft.isOpen ? (
        <div className="mt-2 text-lg font-semibold" style={{ color: "var(--accent-strong)" }}>
          Application cycle is open
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-4 gap-2 text-center">
          {[
            { label: "Days", value: timeLeft.days },
            { label: "Hrs", value: timeLeft.hours },
            { label: "Min", value: timeLeft.minutes },
            { label: "Sec", value: timeLeft.seconds },
          ].map((item) => (
            <div key={item.label} className="panel-muted px-1 py-2">
              <div className="text-lg font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {String(item.value).padStart(2, "0")}
              </div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
        Target: {targetLabel}
      </div>
    </div>
  );
}
