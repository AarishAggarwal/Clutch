export type CompetitionRecord = {
  id: string;
  slug: string;
  name: string;
  location: string;
  type: string;
  interests: string;
  website: string;
  /** When present (e.g. future dataset row), overrides heuristic deadline text */
  deadlineSummary?: string;
  /** When present, overrides heuristic eligibility text */
  eligibilitySummary?: string;
};

