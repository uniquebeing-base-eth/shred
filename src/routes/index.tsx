import { createFileRoute } from "@tanstack/react-router";

import { ShredApp } from "@/components/shred-app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SHRED — Discover and Collect on Celo" },
      {
        name: "description",
        content:
          "Open Shreds, discover ecosystem projects, collect cards, earn rewards, and grow your collection in a mobile-first game experience.",
      },
      { property: "og:title", content: "SHRED — Discover and Collect on Celo" },
      {
        property: "og:description",
        content:
          "A bright, mobile-first discovery and collection game where players open Shreds, claim rewards, and grow their collection.",
      },
      { name: "twitter:title", content: "SHRED — Discover and Collect on Celo" },
      {
        name: "twitter:description",
        content:
          "Open Shreds, discover projects, collect cards, and claim rewards in a mobile-first game experience.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <ShredApp />;
}
