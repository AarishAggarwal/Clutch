import { z } from "zod";

export const essayInputSchema = z.object({
  title: z.string().min(1).max(200),
  essayType: z.string().min(1).max(80),
  content: z.string().max(50000).optional().default(""),
  richContent: z.string().max(200000).optional(),
  plainText: z.string().max(50000).optional(),
  status: z.string().min(1).max(60),
  notes: z.string().max(2000).optional(),
  draft: z.number().int().min(1).max(20).optional(),
  promptText: z.string().max(5000).optional(),
  universitySlug: z.string().max(120).optional(),
  universityName: z.string().max(200).optional(),
  promptId: z.string().max(120).optional(),
  limitType: z.enum(["word", "character"]).optional(),
  limitValue: z.number().int().min(1).max(10000).optional(),
  createVersion: z.boolean().optional(),
  authorRole: z.enum(["student", "counselor"]).optional(),
});

export const essayCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  anchorStart: z.number().int().min(0),
  anchorEnd: z.number().int().min(0),
  quotedText: z.string().max(2000),
  parentId: z.string().optional(),
});

export const activityInputSchema = z.object({
  title: z.string().min(1).max(120),
  category: z.string().min(1).max(80),
  organization: z.string().min(1).max(120),
  role: z.string().min(1).max(120),
  grades: z.string().min(1).max(40),
  hoursPerWeek: z.number().min(0).max(80),
  weeksPerYear: z.number().int().min(1).max(52),
  description: z.string().min(1).max(3000),
  achievementNotes: z.string().max(2000).optional(),
});

export const profileInputSchema = z.object({
  fullName: z.string().max(120).nullish(),
  graduationYear: z.number().int().min(2024).max(2040).nullish(),
  schoolName: z.string().max(200).nullish(),
  gpa: z.number().min(0).max(5).nullish(),
  sat: z.number().int().min(400).max(1600).nullish(),
  act: z.number().int().min(1).max(36).nullish(),
  intendedMajors: z.string().max(500).nullish(),
  courseworkSummary: z.string().max(1000).nullish(),
  location: z.string().max(120).nullish(),
  interests: z.string().max(1000).nullish(),
  notes: z.string().max(4000).nullish(),
  pronouns: z.string().max(60).nullish(),
  boardSystem: z.enum(["CBSE", "ICSE", "IB", "AP"]).nullish(),
  academicData: z.record(z.string(), z.unknown()).nullish(),
});

export const documentInputSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(80),
  content: z.string().max(50000),
  tags: z.array(z.string().min(1).max(40)).max(12).optional(),
});
