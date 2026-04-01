import { z } from "zod";

export const essayInputSchema = z.object({
  title: z.string().min(1).max(200),
  essayType: z.string().min(1).max(80),
  content: z.string().min(1).max(50000),
  status: z.string().min(1).max(60),
  notes: z.string().max(2000).optional(),
  draft: z.number().int().min(1).max(20).optional(),
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
  fullName: z.string().max(120).optional(),
  graduationYear: z.number().int().min(2024).max(2040).optional(),
  schoolName: z.string().max(200).optional(),
  gpa: z.number().min(0).max(5).optional(),
  sat: z.number().int().min(400).max(1600).optional(),
  act: z.number().int().min(1).max(36).optional(),
  intendedMajors: z.string().max(500).optional(),
  courseworkSummary: z.string().max(1000).optional(),
  location: z.string().max(120).optional(),
  interests: z.string().max(1000).optional(),
  notes: z.string().max(4000).optional(),
});

export const documentInputSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(80),
  content: z.string().max(50000),
  tags: z.array(z.string().min(1).max(40)).max(12).optional(),
});
