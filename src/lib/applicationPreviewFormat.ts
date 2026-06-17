type BoardSystem = "CBSE" | "ICSE" | "IB" | "AP" | null | undefined;

export type PreviewProfile = {
  fullName?: string | null;
  pronouns?: string | null;
  graduationYear?: number | null;
  schoolName?: string | null;
  gpa?: number | null;
  sat?: number | null;
  act?: number | null;
  intendedMajors?: string | null;
  courseworkSummary?: string | null;
  location?: string | null;
  interests?: string | null;
  notes?: string | null;
  boardSystem?: BoardSystem;
  academicData?: Record<string, unknown> | null;
};

export type PreviewField = { label: string; value: string };

export function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const text = String(value).trim();
  return text || "—";
}

export function formatGraduationMonthYear(year: number | null | undefined): string {
  if (!year) return "—";
  return `05/${year}`;
}

export function profilePreviewSections(profile: PreviewProfile | null): Array<{ title: string; fields: PreviewField[] }> {
  if (!profile) return [];

  const ad = profile.academicData ?? {};
  const sections: Array<{ title: string; fields: PreviewField[] }> = [
    {
      title: "Personal information",
      fields: [
        { label: "Name", value: displayValue(profile.fullName) },
        { label: "Pronouns", value: displayValue(profile.pronouns) },
      ],
    },
    {
      title: "Contact details",
      fields: [{ label: "Location", value: displayValue(profile.location) }],
    },
    {
      title: "Education",
      fields: [
        { label: "Current or most recent secondary school", value: displayValue(profile.schoolName) },
        { label: "Graduation date", value: formatGraduationMonthYear(profile.graduationYear) },
        { label: "Board system", value: displayValue(profile.boardSystem) },
        { label: "GPA (unweighted)", value: profile.gpa != null ? profile.gpa.toFixed(2) : "—" },
        { label: "Coursework summary", value: displayValue(profile.courseworkSummary) },
        { label: "Intended major(s)", value: displayValue(profile.intendedMajors) },
        { label: "Interests & spikes", value: displayValue(profile.interests) },
      ],
    },
  ];

  if (profile.boardSystem === "CBSE" || profile.boardSystem === "ICSE") {
    const boardFields: PreviewField[] = [];
    for (const key of ["class9", "class10", "class11", "class12Predicted"] as const) {
      const val = ad[key];
      if (val != null && val !== "") {
        const label = key.replace("class", "Class ").replace("Predicted", " (predicted)");
        boardFields.push({ label: `${label} %`, value: String(val) });
      }
    }
    if (boardFields.length) {
      sections.push({ title: `${profile.boardSystem} grades`, fields: boardFields });
    }
  }

  if (profile.boardSystem === "IB") {
    const ibFields: PreviewField[] = [
      { label: "HL subjects", value: displayValue(ad.hlSubjects as string) },
      { label: "SL subjects", value: displayValue(ad.slSubjects as string) },
      { label: "Predicted grades", value: displayValue(ad.predictedGrades as string) },
      {
        label: "Total predicted score",
        value: ad.totalPredicted != null ? String(ad.totalPredicted) : "—",
      },
    ].filter((f) => f.value !== "—");
    if (ibFields.length) sections.push({ title: "IB diploma", fields: ibFields });
  }

  if (profile.boardSystem === "AP") {
    const apFields: PreviewField[] = [
      { label: "AP subjects", value: displayValue(ad.apSubjects as string) },
      { label: "AP scores", value: displayValue(ad.apScores as string) },
    ].filter((f) => f.value !== "—");
    if (apFields.length) sections.push({ title: "Advanced Placement", fields: apFields });
  }

  const testingFields: PreviewField[] = [];
  if (profile.sat != null) testingFields.push({ label: "SAT total", value: String(profile.sat) });
  if (profile.act != null) testingFields.push({ label: "ACT composite", value: String(profile.act) });
  if (testingFields.length) {
    sections.push({ title: "Testing", fields: testingFields });
  }

  if (profile.notes?.trim()) {
    sections.push({
      title: "Additional context",
      fields: [{ label: "Notes", value: profile.notes.trim() }],
    });
  }

  return sections;
}

export function activityHeadline(role: string, organization: string, title: string): string {
  const parts = [role, organization].map((p) => p.trim()).filter(Boolean);
  if (parts.length) return parts.join(", ");
  return title.trim() || "Activity";
}
