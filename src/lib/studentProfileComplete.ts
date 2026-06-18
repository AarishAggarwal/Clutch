export type ProfileLike = {
  fullName?: string | null;
  schoolName?: string | null;
  graduationYear?: number | null;
  interests?: string | null;
  notes?: string | null;
};

/** True after the student has finished the one-time onboarding form (or equivalent profile data). */
export function isStudentProfileComplete(profile: ProfileLike | null | undefined): boolean {
  if (!profile) return false;
  const hasBasics =
    Boolean(profile.fullName?.trim()) &&
    Boolean(profile.schoolName?.trim()) &&
    Boolean(profile.graduationYear) &&
    Boolean(profile.interests?.trim());
  const finishedOnboarding = Boolean(profile.notes?.includes("Platform use purpose:"));
  return hasBasics && finishedOnboarding;
}
