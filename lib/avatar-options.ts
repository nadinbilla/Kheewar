import type { AvatarVariant } from "@/lib/types";

export type AvatarHeadwear = "hijab" | "khimar" | "peci" | "none";
export type AvatarOutfit = "casual" | "formal" | "traditional";

export type AvatarAppearance = {
  avatar_variant: AvatarVariant;
  avatar_color: string;
  skin_tone: string;
  avatar_headwear: AvatarHeadwear;
  avatar_outfit: AvatarOutfit;
};

export const AVATAR_STORAGE_KEY = "kheewar-avatar-creator-v1";
export const skinTones = ["#f4d7ba", "#e8bb93", "#dba273", "#bd8159", "#965f3e", "#674128"] as const;
export const outfitColors = ["#149e9a", "#ee5e71", "#eda427", "#3986e8", "#8263dc", "#283848", "#6a886f", "#b48376"] as const;
export const initialAppearance: AvatarAppearance = {
  avatar_variant: "female_hijab",
  avatar_color: "#3986e8",
  skin_tone: "#dba273",
  avatar_headwear: "hijab",
  avatar_outfit: "traditional",
};

export function normalizeAppearance(candidate: Partial<AvatarAppearance>): AvatarAppearance {
  const variant = candidate.avatar_variant === "male_modest" ? "male_modest" : "female_hijab";
  const allowedHeadwear = variant === "male_modest" ? ["peci", "none"] : ["hijab", "khimar"];
  const headwear = allowedHeadwear.includes(candidate.avatar_headwear ?? "")
    ? (candidate.avatar_headwear as AvatarHeadwear)
    : variant === "female_hijab" ? "hijab" : "peci";
  return {
    avatar_variant: variant,
    avatar_color: /^#[0-9a-fA-F]{6}$/.test(candidate.avatar_color ?? "") ? candidate.avatar_color! : initialAppearance.avatar_color,
    skin_tone: /^#[0-9a-fA-F]{6}$/.test(candidate.skin_tone ?? "") ? candidate.skin_tone! : initialAppearance.skin_tone,
    avatar_headwear: headwear,
    avatar_outfit: ["casual", "formal", "traditional"].includes(candidate.avatar_outfit ?? "")
      ? candidate.avatar_outfit! : initialAppearance.avatar_outfit,
  };
}

export function readDemoProfile(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(AVATAR_STORAGE_KEY);
    if (!value) return null;
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch { return null; }
}

export function writeDemoProfile(profile: object) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(profile));
}
