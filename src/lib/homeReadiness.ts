export type ReadinessSnapshot = {
  overallScore: number;
  label: "Strong Match" | "Developing" | "Competitive" | "Needs Work";
  dimensions: Array<{ key: string; title: string; score: number; note: string }>;
  insights: string[];
  statusTags: string[];
};

export const homeReadinessMock: ReadinessSnapshot = {
  overallScore: 82,
  label: "Competitive",
  dimensions: [
    { key: "academics", title: "GPA / Academics", score: 88, note: "Strong transcript trend in junior year." },
    { key: "testing", title: "Test Scores", score: 71, note: "Solid SAT baseline, room to lift math." },
    { key: "rigor", title: "Coursework / Rigor", score: 86, note: "AP/IB choices align with intended majors." },
    { key: "activities", title: "Extracurriculars", score: 74, note: "Leadership present; impact clarity can improve." },
    { key: "essays", title: "Essays / Narrative", score: 79, note: "Voice is strong; specificity still developing." },
    { key: "progress", title: "Recommendations / Application Progress", score: 83, note: "Application timeline is mostly on track." },
  ],
  insights: [
    "Your profile is strongest in rigor and academics.",
    "Most immediate upside: deepen activity impact language.",
    "Essay revisions are trending positive across latest drafts.",
  ],
  statusTags: ["Strong Rigor", "Essays In Progress", "Activities Need Work", "Testing Optional"],
};
