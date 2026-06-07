import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const openPackInput = z.object({
  packKey: z.enum(["starter", "mystery", "alpha", "legendary"]),
});

const rewardSets = {
  starter: {
    title: "You Discovered!",
    rewards: [
      { label: "CELO", value: "+0.05", accent: "gold" },
      { label: "MENTO", value: "+100", accent: "green" },
      { label: "Common MENTO Card", value: "NEW", accent: "violet" },
      { label: "Points", value: "+150", accent: "gold" },
    ],
  },
  mystery: {
    title: "Rare Pull!",
    rewards: [
      { label: "CELO", value: "+0.08", accent: "gold" },
      { label: "UBE", value: "+60", accent: "violet" },
      { label: "Rare UBE Card", value: "NEW", accent: "cyan" },
      { label: "Points", value: "+240", accent: "gold" },
    ],
  },
  alpha: {
    title: "Alpha Rewards!",
    rewards: [
      { label: "CELO", value: "+0.12", accent: "gold" },
      { label: "GOOD", value: "+420", accent: "cyan" },
      { label: "Epic GOOD Card", value: "NEW", accent: "violet" },
      { label: "Points", value: "+420", accent: "gold" },
    ],
  },
  legendary: {
    title: "Legendary Pull!",
    rewards: [
      { label: "CELO", value: "+0.20", accent: "gold" },
      { label: "MENTO", value: "+500", accent: "green" },
      { label: "Legendary MENTO Card", value: "NEW", accent: "gold" },
      { label: "Points", value: "+900", accent: "gold" },
    ],
  },
} as const;

export const openShredPack = createServerFn({ method: "POST" })
  .inputValidator((data) => openPackInput.parse(data))
  .handler(async ({ data }) => {
    const result = rewardSets[data.packKey];

    return {
      packKey: data.packKey,
      title: result.title,
      rewards: result.rewards,
      claimReady: true,
      claimedAt: null,
    };
  });
