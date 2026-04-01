import type { CompetitionRecord } from "@/lib/competitionTypes";

export type CompetitionEnrichment = {
  /** Best-effort guidance when the source dataset has no fixed dates */
  deadlineSummary: string;
  /** Best-effort guidance when the source dataset has no organizer rules */
  eligibilitySummary: string;
};

const DEFAULT_DEADLINE =
  "Deadlines change every cycle. Check the official site for registration windows, submission cutoffs, and regional/national rounds.";
const DEFAULT_ELIGIBILITY =
  "Eligibility (grade, age, residency, team vs. solo) is set by the organizer. Always read the current rules on the official website before registering.";

function norm(s: string) {
  return s.toLowerCase();
}

/**
 * Heuristic enrichment only — not a substitute for official contest rules.
 * The workbook provides Name, Location, Type, Interests, Website only.
 */
export function enrichCompetition(record: CompetitionRecord): CompetitionEnrichment {
  if (record.deadlineSummary?.trim() && record.eligibilitySummary?.trim()) {
    return {
      deadlineSummary: record.deadlineSummary.trim(),
      eligibilitySummary: record.eligibilitySummary.trim(),
    };
  }

  const name = norm(record.name);
  const type = norm(record.type);
  const loc = norm(record.location);
  const online = loc.includes("online");

  let deadlineSummary = DEFAULT_DEADLINE;
  let eligibilitySummary = DEFAULT_ELIGIBILITY;

  if (type.includes("olympiad")) {
    deadlineSummary =
      "Many olympiads register in early fall and hold rounds through winter or spring. Confirm exact dates and fees on the organizer’s site.";
    eligibilitySummary =
      "Often targets secondary-school students with grade or age bands per level. Some require school registration through a coordinator.";
  } else if (type.includes("hackathon") || type.includes("hack")) {
    deadlineSummary =
      "Hackathons usually open registration a few weeks before the event; larger events may fill early. Watch the official site for wave releases.";
    eligibilitySummary =
      "Openness varies: some are high-school-only, collegiate-only, or all ages. Check team size limits and whether remote attendance is allowed.";
  } else if (type.includes("math") || name.includes("mathematics") || name.includes("math ")) {
    deadlineSummary =
      "Math contests often follow an annual calendar (early registration → contest day → follow-on rounds). Verify the season for your region on the official site.";
    eligibilitySummary =
      "Typical categories include by grade or age. Some contests require going through a school or official testing center.";
  } else if (type.includes("science fair") || name.includes("science fair")) {
    deadlineSummary =
      "Science fairs are usually tied to a school, regional, or national timeline with staged deadlines for proposals and finals.";
    eligibilitySummary =
      "Eligibility often depends on school/region affiliation and project category rules (safety, ethics). Review the latest rulebook.";
  } else if (type.includes("debate") || type.includes("speech")) {
    deadlineSummary =
      "Debate and speech circuits run on league calendars with registration before each tournament season.";
    eligibilitySummary =
      "Eligibility may depend on school membership in a league, division, and experience level (novice/varisty).";
  } else if (type.includes("robotics") || name.includes("robot")) {
    deadlineSummary =
      "Robotics programs typically announce season themes and key deadlines months ahead of championship events.";
    eligibilitySummary =
      "Teams often need a school or community mentor and may have kit and safety requirements; confirm in program documentation.";
  } else if (type.includes("art") || type.includes("design") || type.includes("poster") || type.includes("drawing")) {
    deadlineSummary =
      "Art and design contests may align with exhibition dates or themed national days; submission windows are usually published on the host page.";
    eligibilitySummary =
      "Watch for age categories, originality, and media format rules. Some contests restrict geography or require parental consent for minors.";
  } else if (type.includes("coding") || type.includes("code") || type.includes("ai")) {
    deadlineSummary =
      "Coding and AI challenges often use rolling rounds or fixed seasonal hackathons. Deadlines are always on the official platform.";
    eligibilitySummary =
      "Check whether the event is individual or team, any language/stack constraints, and if school affiliation is required.";
  } else if (name.includes("kid") || name.includes("junior") || name.includes("children")) {
    eligibilitySummary =
      "This listing sounds youth-oriented; confirm minimum/maximum age or grade brackets and whether a guardian must register.";
  }

  if (online) {
    eligibilitySummary += " Remote or online formats may still restrict who can enter by country or region—verify in the rules.";
  }

  if (loc.includes("india")) {
    eligibilitySummary += " If the contest runs in India, eligibility may reference national boards or state rounds—confirm on the listing.";
  } else if (loc.includes("usa") || loc.includes("united states") || loc.includes("u.s.")) {
    eligibilitySummary += " U.S.-based events may require U.S. residency or a U.S. school; check citizenship and tax/prize rules.";
  }

  return {
    deadlineSummary: record.deadlineSummary?.trim() || deadlineSummary,
    eligibilitySummary: record.eligibilitySummary?.trim() || eligibilitySummary,
  };
}
