export type EssayLike = {
  essayType: string;
  universitySlug?: string | null;
};

export function isSupplementEssay(e: EssayLike): boolean {
  return Boolean(e.universitySlug) || e.essayType.toLowerCase().includes("supplement");
}

export function partitionEssays<T extends EssayLike>(essays: T[]) {
  const supplementEssays = essays.filter(isSupplementEssay);
  const commonEssays = essays.filter((e) => !isSupplementEssay(e));
  return { commonEssays, supplementEssays };
}
