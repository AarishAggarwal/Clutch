"use client";

import * as React from "react";
import { partitionEssays } from "@/lib/essayCategories";
import {
  activityHeadline,
  profilePreviewSections,
  type PreviewProfile,
} from "@/lib/applicationPreviewFormat";

export type PreviewActivity = {
  id: string;
  title: string;
  category: string;
  organization: string;
  role: string;
  grades: string;
  hoursPerWeek: number;
  weeksPerYear: number;
  description: string;
};

export type PreviewEssay = {
  id: string;
  title: string;
  essayType: string;
  status: string;
  wordCount: number | null;
  content?: string;
  plainText?: string | null;
  promptText?: string | null;
  universityName?: string | null;
  universitySlug?: string | null;
};

type Props = {
  profile: PreviewProfile | null;
  studentId?: string | null;
  activities: PreviewActivity[];
  essays: PreviewEssay[];
};

function essayBody(essay: PreviewEssay): string {
  return (essay.plainText ?? essay.content ?? "").trim();
}

function PreviewFieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="ca-preview-field">
      <dt className="ca-preview-field-label">{label}</dt>
      <dd className="ca-preview-field-value">{value}</dd>
    </div>
  );
}

export default function CommonAppPreviewDocument({ profile, studentId, activities, essays }: Props) {
  const sections = profilePreviewSections(profile);
  const { commonEssays, supplementEssays } = React.useMemo(() => partitionEssays(essays), [essays]);
  const generated = React.useMemo(
    () => new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }),
    [],
  );

  const displayName = profile?.fullName?.trim() || "Applicant";
  const headerLine = [
    profile?.graduationYear ? `Fall ${profile.graduationYear}` : null,
    studentId ? `Student ID: ${studentId}` : null,
    `Preview · ${generated}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="ca-preview-doc" aria-label="Common App style application preview">
      <header className="ca-preview-header">
        <h1 className="ca-preview-applicant">{displayName}</h1>
        <p className="ca-preview-meta">{headerLine}</p>
      </header>

      <section className="ca-preview-section">
        <h2 className="ca-preview-section-title">Profile</h2>
        {sections.length === 0 ? (
          <p className="ca-preview-empty">No profile information saved yet.</p>
        ) : (
          sections.map((section) => (
            <div key={section.title} className="ca-preview-subsection">
              <h3 className="ca-preview-subsection-title">{section.title}</h3>
              <dl className="ca-preview-fields">
                {section.fields.map((field) => (
                  <PreviewFieldRow key={`${section.title}-${field.label}`} label={field.label} value={field.value} />
                ))}
              </dl>
            </div>
          ))
        )}
      </section>

      <section className="ca-preview-section">
        <h2 className="ca-preview-section-title">Activities</h2>
        {activities.length === 0 ? (
          <p className="ca-preview-empty">No activities recorded.</p>
        ) : (
          <div className="ca-preview-activities">
            {activities.map((activity) => (
              <div key={activity.id} className="ca-preview-activity">
                <div className="ca-preview-activity-category">{activity.category || "Activity"}</div>
                <div className="ca-preview-activity-meta">
                  <span>{activity.grades || "—"}</span>
                  <span>
                    {activity.hoursPerWeek} hr/wk, {activity.weeksPerYear} wk/yr
                  </span>
                </div>
                <div className="ca-preview-activity-headline">
                  {activityHeadline(activity.role, activity.organization, activity.title)}
                </div>
                <p className="ca-preview-activity-description">{activity.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="ca-preview-section">
        <h2 className="ca-preview-section-title">Writing</h2>
        {commonEssays.length === 0 && supplementEssays.length === 0 ? (
          <p className="ca-preview-empty">No essay drafts saved.</p>
        ) : (
          <div className="ca-preview-writing">
            {commonEssays.map((essay, index) => (
              <div key={essay.id} className="ca-preview-essay-block">
                <h3 className="ca-preview-essay-label">
                  {index === 0 ? "Personal essay" : essay.title || "Additional essay"}
                </h3>
                {essay.promptText?.trim() ? (
                  <p className="ca-preview-prompt">{essay.promptText.trim()}</p>
                ) : null}
                <div className="ca-preview-essay-body">
                  {essayBody(essay) || <span className="ca-preview-empty-inline">No essay text yet.</span>}
                </div>
              </div>
            ))}

            {supplementEssays.map((essay) => (
              <div key={essay.id} className="ca-preview-essay-block">
                <h3 className="ca-preview-essay-label">
                  {essay.universityName
                    ? `${essay.universityName} supplement`
                    : essay.title || "Supplemental essay"}
                </h3>
                {essay.promptText?.trim() ? (
                  <p className="ca-preview-prompt">{essay.promptText.trim()}</p>
                ) : null}
                <div className="ca-preview-essay-body">
                  {essayBody(essay) || <span className="ca-preview-empty-inline">No essay text yet.</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="ca-preview-footer">
        <span>{displayName}</span>
        {studentId ? <span>Student ID: {studentId}</span> : null}
        <span>Clutch application preview</span>
      </footer>
    </article>
  );
}
