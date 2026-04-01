"use client";

import Link from "next/link";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/sections/HeroSection";
import { ProductPreviewSection } from "@/components/landing/sections/ProductPreviewSection";
import { FeatureGridSection } from "@/components/landing/sections/FeatureGridSection";
import { HowItWorksSection } from "@/components/landing/sections/HowItWorksSection";
import { DifferentiationSection } from "@/components/landing/sections/DifferentiationSection";
import { TrustSection } from "@/components/landing/sections/TrustSection";
import { PricingSection } from "@/components/landing/sections/PricingSection";
import { FinalCtaSection } from "@/components/landing/sections/FinalCtaSection";

export default function LandingPage() {
  return (
    <div className="min-h-full" style={{ background: "var(--bg-app)" }}>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[min(70vh,520px)] opacity-100"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% -10%, color-mix(in oklab, var(--accent) 12%, transparent), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 40%, color-mix(in oklab, var(--accent) 8%, transparent), transparent 45%)",
        }}
      />

      <LandingHeader />

      <div className="page-wrap relative max-w-7xl pb-16 pt-4 sm:pb-20">
        <HeroSection />
        <ProductPreviewSection />
        <FeatureGridSection />
        <HowItWorksSection />
        <DifferentiationSection />
        <TrustSection />
        <PricingSection />
        <FinalCtaSection />

        <footer className="mt-8 border-t pt-10 text-center" style={{ borderColor: "var(--border-soft)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} Astra Admissions OS ·{" "}
            <Link href="/auth/login?role=student" className="underline underline-offset-2" style={{ color: "var(--text-secondary)" }}>
              Log in
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
