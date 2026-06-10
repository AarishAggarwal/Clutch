export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function computeReadiness(params: {
  essayCount: number;
  activityCount: number;
  gpa?: number | null;
  sat?: number | null;
  act?: number | null;
}) {
  const essayScore = clamp(Math.round((params.essayCount / 8) * 100), 0, 100);
  const activityScore = clamp(Math.round((params.activityCount / 10) * 100), 0, 100);
  const gpaScore = params.gpa != null ? clamp(Math.round((params.gpa / 4) * 100), 0, 100) : 0;
  const testBase =
    params.sat != null
      ? Math.round((params.sat / 1600) * 100)
      : params.act != null
        ? Math.round((params.act / 36) * 100)
        : 0;
  const gradesScore = clamp(Math.round(gpaScore * 0.7 + testBase * 0.3), 0, 100);
  return {
    essayScore,
    activityScore,
    gradesScore,
    overall: Math.round((essayScore + activityScore + gradesScore) / 3),
  };
}

export function studentStatus(readiness: number): "on_track" | "needs_attention" | "at_risk" {
  if (readiness >= 70) return "on_track";
  if (readiness >= 45) return "needs_attention";
  return "at_risk";
}
