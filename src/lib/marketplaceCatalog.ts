export type MarketplaceApplication = {
  id: string;
  universityShort: string;
  universityFull: string;
  studentName: string;
  admissionYear: number;
  program: string;
  priceInr: number;
  /** Relative path from project root (not publicly served) */
  pdfPath: string;
  previewLines: string[];
};

export const MARKETPLACE_APPLICATIONS: MarketplaceApplication[] = [
  {
    id: "nyu-tandon-aarish-aggarwal",
    universityShort: "NYU",
    universityFull: "NYU Tandon School of Engineering",
    studentName: "Aarish Aggarwal",
    admissionYear: 2026,
    program: "Computer Science · Regular Decision",
    priceInr: 100,
    pdfPath: "private/marketplace/nyu-tandon-aarish-aggarwal.pdf",
    previewLines: [
      "Education — Jayshree Periwal International School (IB Diploma), graduation 05/2026.",
      "Testing — SAT Evidence-based Reading and Writing 730; Math 790.",
      "Activities — Founder, CropWise; Research Intern, Gurugram Police Cyber Security; FRC Coding Vice Captain.",
      "Writing — Personal essay on learning from farmers and building CropWise for grain storage safety.",
    ],
  },
];

export function getMarketplaceApplication(id: string): MarketplaceApplication | undefined {
  return MARKETPLACE_APPLICATIONS.find((a) => a.id === id);
}

export function marketplaceAmountPaise(app: MarketplaceApplication): number {
  return app.priceInr * 100;
}
