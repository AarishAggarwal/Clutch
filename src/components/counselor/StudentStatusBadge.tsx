const styles: Record<string, { bg: string; text: string; label: string }> = {
  on_track: { bg: "color-mix(in oklab, #10b981 18%, transparent)", text: "#059669", label: "On track" },
  needs_attention: { bg: "color-mix(in oklab, #f59e0b 18%, transparent)", text: "#d97706", label: "Needs attention" },
  at_risk: { bg: "color-mix(in oklab, #f43f5e 18%, transparent)", text: "#e11d48", label: "At risk" },
};

export default function StudentStatusBadge({ status }: { status: string }) {
  const s = styles[status] ?? styles.needs_attention;
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}
