export function toStudentId(profileId: string): string {
  const tail = profileId.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase();
  return `STU-${tail || "00000000"}`;
}

