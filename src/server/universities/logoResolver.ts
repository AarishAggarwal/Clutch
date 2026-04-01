function extractDomain(website: string | null | undefined) {
  if (!website) return null;
  try {
    const normalized = website.startsWith("http") ? website : `https://${website}`;
    return new URL(normalized).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function resolveUniversityLogo(params: { explicitLogoUrl?: string | null; website?: string | null; name: string }) {
  if (params.explicitLogoUrl) {
    return { logoUrl: params.explicitLogoUrl, logoSource: "official" };
  }
  const domain = extractDomain(params.website);
  if (domain) {
    return {
      logoUrl: `https://img.logo.dev/${domain}?token=pk_XJ7Ve6t4RTOQpvXX7M6i9A`,
      logoSource: "logo.dev",
    };
  }
  return { logoUrl: null, logoSource: "monogram" };
}

export function getUniversityMonogram(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
