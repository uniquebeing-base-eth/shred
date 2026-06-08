export type NavTab = "home" | "shreds" | "collection" | "swap" | "profile";

export type PackAccent = "blue" | "violet" | "gold" | "dark";

export interface RewardItem {
  label: string;
  value: string;
  accent: "gold" | "green" | "violet" | "cyan";
  note?: string;
}

export interface PackOption {
  key: "starter" | "mystery" | "alpha" | "legendary";
  name: string;
  price: string;
  rarityHint: string;
  accent: PackAccent;
  blurb: string;
  tagline: string;
}

export const packOptions: PackOption[] = [
  {
    key: "starter",
    name: "Starter Shred",
    price: "Free",
    rarityHint: "Daily common rewards",
    accent: "blue",
    tagline: "Friendly drop",
    blurb: "Small CELO, token drops, common cards, and points every 24 hours.",
  },
  {
    key: "mystery",
    name: "Mystery Shred",
    price: "0.10 cUSD",
    rarityHint: "Rare cards + bonus points",
    accent: "violet",
    tagline: "Magical pull",
    blurb: "Balanced reward table with rare card chance and ecosystem token rewards.",
  },
  {
    key: "alpha",
    name: "Alpha Shred",
    price: "0.50 cUSD",
    rarityHint: "Higher reward pool",
    accent: "gold",
    tagline: "Premium value",
    blurb: "Better odds for premium rewards and stronger rare-card probabilities.",
  },
  {
    key: "legendary",
    name: "Legendary Shred",
    price: "1.00 cUSD",
    rarityHint: "Epic + legendary focus",
    accent: "dark",
    tagline: "Lightning rare",
    blurb: "Highest reward pool with the best legendary and premium token outcomes.",
  },
];

export const tokenHoldings = [
  { symbol: "CELO", amount: "0.38", value: "$0.24", accent: "gold" as const },
  { symbol: "MENTO", amount: "400", value: "$8.60", accent: "green" as const },
  { symbol: "UBE", amount: "80", value: "$4.15", accent: "violet" as const },
  { symbol: "GOOD", amount: "2,000", value: "$11.22", accent: "cyan" as const },
];

export const collectionCards = [
  { name: "MENTO", rarity: "Legendary" as const, accent: "gold" as const },
  { name: "UBE", rarity: "Epic" as const, accent: "violet" as const },
  { name: "MOBI", rarity: "Rare" as const, accent: "cyan" as const },
  { name: "GOOD", rarity: "Common" as const, accent: "green" as const },
  { name: "CELO", rarity: "Rare" as const, accent: "gold" as const },
  { name: "???", rarity: "Mythic" as const, accent: "violet" as const },
];

export const dailyQuests = [
  { title: "Open 1 Shred", progress: 1, reward: "100 pts", icon: "🎁" },
  { title: "Discover 1 Project", progress: 0.25, reward: "150 pts", icon: "🔎" },
  { title: "Collect 3 Cards", progress: 0.4, reward: "150 pts", icon: "🃏" },
];

export const leaderboard = [
  { rank: 1, name: "NovaCollector", level: "Level 14 Legend", points: "8,920" },
  { rank: 2, name: "MentoHunter", level: "Level 13 Master", points: "8,110" },
  { rank: 3, name: "CeloScout", level: "Level 12 Collector", points: "7,540" },
];

export const swapRoutes = [
  { from: "MENTO", to: "CELO", output: "0.082", fee: "0.3%", impact: "Low" },
  { from: "GOOD", to: "cUSD", output: "2.48", fee: "0.4%", impact: "Low" },
  { from: "UBE", to: "CELO", output: "0.019", fee: "0.3%", impact: "Low" },
];

export const homeRewards: RewardItem[] = [
  { label: "CELO", value: "+0.05", accent: "gold" },
  { label: "MENTO", value: "+100", accent: "green" },
  { label: "Epic MENTO Card", value: "NEW", accent: "violet" },
  { label: "Points", value: "+150", accent: "gold" },
];

export const profileStats = [
  { label: "Friends invited", value: "12" },
  { label: "Discoveries", value: "23" },
  { label: "Highest rarity", value: "Legendary" },
  { label: "Streak", value: "7 days" },
];

export const discoverProjects = [
  { name: "MENTO", tagline: "The stable money standard for Celo.", category: "DeFi", token: "MENTO", accent: "green" as const },
  { name: "UBE", tagline: "Swap-friendly liquidity and rewards.", category: "DeFi", token: "UBE", accent: "violet" as const },
  { name: "GOOD", tagline: "Impact-driven asset rewards.", category: "Social", token: "GOOD", accent: "gold" as const },
  { name: "MOBI", tagline: "Infrastructure tools across the ecosystem.", category: "Infra", token: "MOBI", accent: "cyan" as const },
];
