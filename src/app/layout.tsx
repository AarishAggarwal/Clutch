import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppNav from "@/components/AppNav";
import CounselorWidget from "@/components/counselor/CounselorWidget";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Astra Admissions OS",
  description:
    "Admissions workspace for essays, college discovery, competitions, projects, and counselor coordination—structured AI for serious applicants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={[
          inter.className,
          "app-surface h-full antialiased",
        ].join(" ")}
      >
        <Providers>
          <div className="flex h-full min-h-0 flex-col">
            <AppNav />
            <main className="flex-1 min-h-0">{children}</main>
            <CounselorWidget />
          </div>
        </Providers>
      </body>
    </html>
  );
}
