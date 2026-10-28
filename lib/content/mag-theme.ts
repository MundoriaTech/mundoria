/** Colour accents for Mundoria Mag categories (WeCasa-style section energy). */

export const MAG_CATEGORY_THEME: Record<
  string,
  {
    chip: string;
    chipActive: string;
    soft: string;
    label: string;
    accent: string;
  }
> = {
  "Cleaning Tips": {
    accent: "#d4694a",
    chip: "border-brand-peach/70 bg-[#fff4ee] text-[#8a3d28]",
    chipActive: "border-transparent bg-brand-terracotta text-white shadow-[0_6px_16px_rgba(212,105,74,0.35)]",
    label: "text-brand-terracotta",
    soft: "bg-gradient-to-br from-[#fff4ee] via-brand-haze to-brand-lavender-light",
  },
  "Home Care": {
    accent: "#b85a8a",
    // Was #f5eaf1 — too close to the Mag page wash, so the pill looked colourless
    chip: "border-[#f5b8cb] bg-[#ffe8f0] text-[#c2186a]",
    chipActive: "border-transparent bg-[#b85a8a] text-white shadow-[0_6px_16px_rgba(184,90,138,0.35)]",
    label: "text-[#b85a8a]",
    soft: "bg-gradient-to-br from-[#f0e4ec] via-brand-haze to-brand-lavender-light",
  },
  "Host Tips": {
    accent: "#2f6f6a",
    chip: "border-[#9fd4cf]/80 bg-[#e8f7f5] text-[#1f4f4b]",
    chipActive: "border-transparent bg-[#2f6f6a] text-white shadow-[0_6px_16px_rgba(47,111,106,0.35)]",
    label: "text-[#2f6f6a]",
    soft: "bg-gradient-to-br from-[#e8f7f5] via-brand-haze to-brand-lavender-light",
  },
  "Local Life": {
    accent: "#4a7ab5",
    chip: "border-[#b7d0ea] bg-[#e8f2ff] text-[#2f557f]",
    chipActive: "border-transparent bg-[#4a7ab5] text-white shadow-[0_6px_16px_rgba(74,122,181,0.35)]",
    label: "text-[#4a7ab5]",
    soft: "bg-gradient-to-br from-[#e8f2ff] via-brand-haze to-brand-lavender-light",
  },
  "Cleaner Stories": {
    accent: "#312c79",
    chip: "border-[#b8b3e0] bg-[#eeecff] text-brand-indigo",
    chipActive: "border-transparent bg-brand-indigo text-white shadow-[0_6px_16px_rgba(49,44,121,0.35)]",
    label: "text-brand-indigo",
    soft: "bg-gradient-to-br from-[#eeecff] via-brand-haze to-[#fff4ee]",
  },
  "Company News": {
    accent: "#5c5a66",
    chip: "border-[#c8c6d0] bg-[#ececef] text-[#3f3d48]",
    chipActive: "border-transparent bg-[#5c5a66] text-white shadow-[0_6px_16px_rgba(92,90,102,0.35)]",
    label: "text-[#5c5a66]",
    soft: "bg-gradient-to-br from-[#ececef] via-brand-haze to-brand-lavender-light",
  },
};

export const DEFAULT_MAG_THEME = MAG_CATEGORY_THEME["Cleaning Tips"];

export function magThemeFor(category: string) {
  return MAG_CATEGORY_THEME[category] ?? DEFAULT_MAG_THEME;
}
