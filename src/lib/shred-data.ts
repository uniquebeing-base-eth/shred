export type NavTab = "home" | "shreds" | "collection" | "swap" | "profile";

export interface RewardItem {
  label: string;
  value: string;
  accent: "gold" | "green" | "violet" | "cyan";
  note?: string;
}

export interface PackOption {
  key: string;
  name: string;
  price: string;
  rarityHint: string;
  accent: "blue" | "violet" | "gold" | "dark";
  blurb: string;
}

export interface ProjectCard {
  name: string;
  tagline: string;
  category: string;
  token: string;
  accent: "green" | "violet" | "gold" | "cyan";
}

export interface CardCollectible {
  name: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary" | "Mythic";
  accent: "green" | "violet" | "gold" | "cyan" | "dark";
}

export interface TokenHolding {
  symbol: string;
  amount: string;
  value: string;
  accent: "green" | "violet" | "gold" | "cyan";
}

export interface QuestItem {
  title: string;
  progress: number;
  reward: string;
  icon: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  level: string;
  points: string;
}

export const packOptions: PackOption[] = [
  {
    key: "starter",
    name: "Starter Shred",
    price: "Free",
    rarityHint: "Daily common rewards",
    accent: "blue",
    blurb: "Small CELO, token drops, common cards, and points every 24 hours.",
  },
  {
    key: "mystery",
    name: "Mystery Shred",
    price: "0.10 cUSD",
    rarityHint: "Rare cards + bonus points",
    accent: "violet",
    blurb: "Balanced reward table with rare card chance and ecosystem token rewards.",
  },
  {
    key: "alpha",
    name: "Alpha Shred",
    price: "0.50 cUSD",
    rarityHint: "Higher reward pool",
    accent: "gold",
    blurb: "Better odds for premium rewards and stronger rare-card probabilities.",
  },
  {
    key: "legendary",
    name: "Legendary Shred",
    price: "1.00 cUSD",
    rarityHint: "Epic + legendary focus",
    accent: "dark",
    blurb: "Highest reward pool with the best legendary and premium token outcomes.",
  },
];

export const homeRewards: RewardItem[] = [
  { label: "CELO", value: "+0.05", accent: "gold" },
  { label: "MENTO", value: "+100", accent: "green" },
  { label: "Epic MENTO Card", value: "NEW", accent: "violet", note: "Card" },
  { label: "Points", value: "+150", accent: "gold" },
];

export const discoverProjects: ProjectCard[] = [
  {
    name: "MENTO",
    tagline: "The stable money standard for Celo.",
    category: "DeFi",
    token: "MENTO",
    accent: "green",
  },
  {
    name: "UBE",
    tagline: "Swap-friendly liquidity and community rewards.",
    category: "DeFi",
    token: "UBE",
    accent: "violet",
  },
  {
    name: "GOOD",
    tagline: "Impact-driven asset rewards built for everyday players.",
    category: "Social",
    token: "GOOD",
    accent: "gold",
  },
  {
    name: "MOBI",
    tagline: "Infrastructure tools powering movement across the ecosystem.",
    category: "Infrastructure",
    token: "MOBI",
    accent: "cyan",
  },
];

export const collectionCards: CardCollectible[] = [
  { name: "MENTO", rarity: "Legendary", accent: "gold" },
  { name: "UBE", rarity: "Epic", accent: "violet" },
  { name: "MOBI", rarity: "Rare", accent: "cyan" },
  { name: "GOOD", rarity: "Common", accent: "green" },
  { name: "CELO", rarity: "Rare", accent: "gold" },
  { name: "???", rarity: "Mythic", accent: "dark" },
];

export const tokenHoldings: TokenHolding[] = [
  { symbol: "CELO", amount: "0.38", value: "$0.24", accent: "gold" },
  { symbol: "MENTO", amount: "400", value: "$8.60", accent: "green" },
  { symbol: "UBE", amount: "80", value: "$4.15", accent: "violet" },
  { symbol: "GOOD", amount: "2,000", value: "$11.22", accent: "cyan" },
];

export const dailyQuests: QuestItem[] = [
  { title: "Open 1 Shred", progress: 1, reward: "100 pts", icon: "🎁" },
  { title: "Discover 1 Project", progress: 0.25, reward: "150 pts", icon: "🔎" },
  { title: "Collect 3 Cards", progress: 0.4, reward: "150 pts", icon: "🃏" },
];

export const leaderboard: LeaderboardEntry[] = [
  { rank: 1, name: "NovaCollector", level: "Level 14 Legend", points: "8,920" },
  { rank: 2, name: "MentoHunter", level: "Level 13 Master", points: "8,110" },
  { rank: 3, name: "CeloScout", level: "Level 12 Collector", points: "7,540" },
];

export const swapRoutes = [
  { from: "MENTO", to: "CELO", output: "0.082", fee: "0.3%", impact: "Low" },
  { from: "GOOD", to: "cUSD", output: "2.48", fee: "0.4%", impact: "Low" },
  { from: "UBE", to: "CELO", output: "0.019", fee: "0.3%", impact: "Low" },
];

export const profileStats = [
  { label: "Referral code", value: "SHRED8XQ" },
  { label: "Friends invited", value: "12" },
  { label: "Discoveries", value: "23" },
  { label: "Highest rarity", value: "Legendary" },
];
