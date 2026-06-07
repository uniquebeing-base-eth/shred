import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Crown, Gift, House, RefreshCw, Sparkles, UserRound, WalletCards } from "lucide-react";

import shredLogo from "@/assets/shred-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  collectionCards,
  dailyQuests,
  discoverProjects,
  homeRewards,
  leaderboard,
  packOptions,
  profileStats,
  swapRoutes,
  tokenHoldings,
  type NavTab,
} from "@/lib/shred-data";
import { openShredPack } from "@/lib/shred-functions";

type PackKey = "starter" | "mystery" | "alpha" | "legendary";
type OpeningStep = "confirm" | "opening" | "reveal" | "claimed";

const navItems: Array<{ key: NavTab; label: string; icon: typeof House }> = [
  { key: "home", label: "Home", icon: House },
  { key: "shreds", label: "Shreds", icon: Gift },
  { key: "collection", label: "Collection", icon: WalletCards },
  { key: "swap", label: "Swap", icon: RefreshCw },
  { key: "profile", label: "Profile", icon: UserRound },
];

const accentClassMap = {
  blue: "bg-pack-blue",
  violet: "bg-pack-violet",
  gold: "bg-pack-gold",
  dark: "bg-pack-dark",
  green: "bg-pack-green",
  cyan: "bg-pack-cyan",
} as const;

const ringClassMap = {
  blue: "ring-pack-blue",
  violet: "ring-pack-violet",
  gold: "ring-pack-gold",
  dark: "ring-pack-dark",
  green: "ring-pack-green",
  cyan: "ring-pack-cyan",
} as const;

const textClassMap = {
  blue: "text-pack-blue-foreground",
  violet: "text-pack-violet-foreground",
  gold: "text-pack-gold-foreground",
  dark: "text-pack-dark-foreground",
  green: "text-pack-green-foreground",
  cyan: "text-pack-cyan-foreground",
} as const;

const rarityToneMap = {
  Common: "common",
  Rare: "rare",
  Epic: "epic",
  Legendary: "legendary",
  Mythic: "mythic",
} as const;

export function ShredApp() {
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [selectedPack, setSelectedPack] = useState<PackKey | null>("starter");
  const [openingStep, setOpeningStep] = useState<OpeningStep | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [openingResult, setOpeningResult] = useState<null | {
    packKey: PackKey;
    title: string;
    rewards: Array<{ label: string; value: string; accent: "gold" | "green" | "violet" | "cyan" }>;
    claimReady: boolean;
    claimedAt: null;
  }>(null);

  const openPack = useServerFn(openShredPack);

  const currentPack = useMemo(
    () => packOptions.find((pack) => pack.key === (selectedPack ?? "starter")) ?? packOptions[0],
    [selectedPack],
  );

  const handleOpenPack = async () => {
    if (!selectedPack) return;
    setClaimed(false);
    setOpeningStep("opening");
    const result = await openPack({ data: { packKey: selectedPack } });
    setOpeningResult(result);
    window.setTimeout(() => setOpeningStep("reveal"), 1450);
  };

  const handleClaim = () => {
    setClaimed(true);
    setOpeningStep("claimed");
  };

  return (
    <main className="shred-shell">
      <div className="shred-frame">
        <div className="screen-glow" aria-hidden="true" />
        <div className="screen-stars" aria-hidden="true" />

        {!authReady ? (
          <section className="welcome-panel">
            <img src={shredLogo.url} alt="Shred logo" className="welcome-logo" />
            <div className="welcome-copy">
              <p className="eyebrow">MiniPay-ready onboarding</p>
              <h1>Welcome to Shred</h1>
              <p>
                Your starter Shred is ready. Open packs, discover ecosystem projects, collect cards,
                and claim rewards without thinking about the infrastructure underneath.
              </p>
            </div>
            <Button variant="arcade" size="arcade" onClick={() => setAuthReady(true)}>
              Open Shred
            </Button>
            <p className="welcome-note">MiniPay sign-in placeholder for this MVP foundation.</p>
          </section>
        ) : (
          <>
            <header className="top-bar">
              <div className="player-chip">
                <div className="avatar-ring">
                  <img src={shredLogo.url} alt="Shred player avatar" className="avatar-logo" />
                </div>
                <div>
                  <p className="level-badge">Level 12</p>
                  <h2>Collector</h2>
                  <div className="xp-meter">
                    <span className="xp-fill" style={{ width: "82%" }} />
                    <strong>2,450 / 3,000 XP</strong>
                  </div>
                </div>
              </div>
              <div className="currency-stack">
                <StatPill tone="gold" icon="◎" value="4,350" />
                <StatPill tone="violet" icon="◈" value="120" />
              </div>
            </header>

            <section className="content-area">
              {activeTab === "home" && <HomeTab onOpenStarter={() => { setSelectedPack("starter"); setOpeningStep("confirm"); }} />}
              {activeTab === "shreds" && (
                <ShredsTab
                  selectedPack={selectedPack}
                  onSelectPack={(pack) => setSelectedPack(pack)}
                  onOpen={() => setOpeningStep("confirm")}
                />
              )}
              {activeTab === "collection" && <CollectionTab />}
              {activeTab === "swap" && <SwapTab />}
              {activeTab === "profile" && <ProfileTab />}
            </section>

            <nav className="bottom-nav" aria-label="Primary">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={cn("nav-button", isActive && "nav-button-active")}
                    onClick={() => setActiveTab(item.key)}
                  >
                    <span className={cn("nav-icon-wrap", isActive && "nav-icon-wrap-active")}>
                      <Icon className="nav-icon" />
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {openingStep ? (
              <div className="overlay-backdrop">
                <div className="overlay-card">
                  {openingStep === "confirm" && (
                    <>
                      <div className={cn("pack-hero", accentClassMap[currentPack.accent])}>
                        <div className="pack-burst" aria-hidden="true" />
                        <p className="eyebrow">{currentPack.rarityHint}</p>
                        <h3>{currentPack.name}</h3>
                        <p>{currentPack.blurb}</p>
                        <div className="pack-bag">SHRED</div>
                      </div>
                      <div className="overlay-actions">
                        <div>
                          <p className="overlay-label">Cost</p>
                          <strong>{currentPack.price}</strong>
                        </div>
                        <Button variant="arcade" size="arcade" onClick={handleOpenPack}>
                          Open Pack
                        </Button>
                      </div>
                      <button type="button" className="ghost-close" onClick={() => setOpeningStep(null)}>
                        Not now
                      </button>
                    </>
                  )}

                  {openingStep === "opening" && (
                    <div className="shredding-scene">
                      <p className="eyebrow">Shredding!</p>
                      <div className={cn("shredding-pack", accentClassMap[currentPack.accent])}>SHRED</div>
                      <p>The pack is cracking open and your rewards are being generated.</p>
                    </div>
                  )}

                  {openingStep === "reveal" && openingResult && (
                    <>
                      <div className="reveal-header">
                        <p className="eyebrow">{openingResult.packKey.toUpperCase()} REWARDS</p>
                        <h3>{openingResult.title}</h3>
                      </div>
                      <div className="reward-grid">
                        {openingResult.rewards.map((reward) => (
                          <div key={reward.label} className={cn("reward-tile", accentClassMap[reward.accent], textClassMap[reward.accent])}>
                            <span className="reward-value">{reward.value}</span>
                            <strong>{reward.label}</strong>
                          </div>
                        ))}
                      </div>
                      <Button variant="gold" size="arcade" onClick={handleClaim}>
                        Claim Rewards
                      </Button>
                    </>
                  )}

                  {openingStep === "claimed" && openingResult && (
                    <div className="claim-scene">
                      <div className="claim-badge">Success!</div>
                      <img src={shredLogo.url} alt="Shred logo badge" className="claim-logo" />
                      <p>Your rewards have been added to your collection and are ready for swap or withdrawal flows.</p>
                      <div className="claim-summary">
                        {openingResult.rewards.map((reward) => (
                          <div key={reward.label} className="claim-row">
                            <span>{reward.label}</span>
                            <strong>{reward.value}</strong>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="arcade"
                        size="arcade"
                        onClick={() => {
                          setOpeningStep(null);
                          setClaimed(false);
                        }}
                      >
                        View Collection
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}

function HomeTab({ onOpenStarter }: { onOpenStarter: () => void }) {
  return (
    <div className="tab-stack">
      <section className="hero-card game-sky">
        <div className="hero-copy">
          <p className="eyebrow">Daily Shred Ready</p>
          <h1>Open today’s free pack and discover what drops next.</h1>
          <p>
            Small CELO rewards, ecosystem tokens, collectible cards, and points every 24 hours.
          </p>
          <Button variant="arcade" size="arcade" onClick={onOpenStarter}>
            Shred Now
          </Button>
        </div>
        <div className="hero-pack art-lift">SHRED</div>
      </section>

      <section className="info-grid three-up">
        <MetricCard label="Collection Value" value="$24.21" tone="green" subtext="Across cards and tokens" />
        <MetricCard label="Points" value="4,350" tone="gold" subtext="Level 12 Collector" />
        <MetricCard label="Completion" value="57%" tone="violet" subtext="7 rare · 2 legendary" />
      </section>

      <section className="feature-card purple-flare">
        <div>
          <p className="section-chip">Featured Project</p>
          <h2>MENTO</h2>
          <p>The stable money standard for Celo, featured today with boosted discovery rewards.</p>
        </div>
        <Button variant="gold" size="arcadeSm">Discover</Button>
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <h2>Daily Quests</h2>
          <span>3/5</span>
        </div>
        <div className="quest-list">
          {dailyQuests.map((quest) => (
            <div key={quest.title} className="quest-row">
              <div className="quest-icon">{quest.icon}</div>
              <div className="quest-copy">
                <strong>{quest.title}</strong>
                <div className="progress-bar">
                  <span style={{ width: `${quest.progress * 100}%` }} />
                </div>
              </div>
              <span className="quest-reward">{quest.reward}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <h2>Latest Discovery</h2>
          <Sparkles className="heading-icon" />
        </div>
        <div className="reward-grid compact-grid">
          {homeRewards.map((reward) => (
            <div key={reward.label} className={cn("reward-tile compact", accentClassMap[reward.accent], textClassMap[reward.accent])}>
              <span className="reward-value">{reward.value}</span>
              <strong>{reward.label}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ShredsTab({
  selectedPack,
  onSelectPack,
  onOpen,
}: {
  selectedPack: PackKey | null;
  onSelectPack: (pack: PackKey) => void;
  onOpen: () => void;
}) {
  return (
    <div className="tab-stack">
      <section className="feature-card deep-space">
        <div>
          <p className="section-chip">Shreds</p>
          <h1>Open packs. Discover projects. Collect rewards.</h1>
          <p>No empty packs. Every Shred moves your collection forward.</p>
        </div>
        <div className="mini-stat-card">
          <span>My Packs</span>
          <strong>12</strong>
        </div>
      </section>

      <section className="pack-grid">
        {packOptions.map((pack) => {
          const isSelected = selectedPack === pack.key;
          return (
            <button
              type="button"
              key={pack.key}
              className={cn("pack-card", accentClassMap[pack.accent], ringClassMap[pack.accent], isSelected && "pack-card-selected")}
              onClick={() => onSelectPack(pack.key as PackKey)}
            >
              <div className="pack-bag large">SHRED</div>
              <div className="pack-card-copy">
                <h3>{pack.name}</h3>
                <p>{pack.blurb}</p>
              </div>
              <div className="pack-card-footer">
                <strong>{pack.price}</strong>
                <span>{pack.rarityHint}</span>
              </div>
            </button>
          );
        })}
      </section>

      <section className="feature-card game-sky compact-banner">
        <div>
          <p className="section-chip">Daily Shred</p>
          <h2>Starter Shred refreshes every 24 hours.</h2>
        </div>
        <Button variant="arcade" size="arcade" onClick={onOpen}>
          Claim When Ready
        </Button>
      </section>

      <section className="feature-card purple-flare compact-banner">
        <div>
          <p className="section-chip">Live Event</p>
          <h2>MENTO Discovery Week</h2>
          <p>3x MENTO reward boost with exclusive card pulls and bonus quests.</p>
        </div>
        <div className="event-pill">3x Drop Rate</div>
      </section>
    </div>
  );
}

function CollectionTab() {
  return (
    <div className="tab-stack">
      <section className="info-grid two-up">
        <MetricCard label="Collection Value" value="$24.21" tone="green" subtext="Tokens + cards" />
        <MetricCard label="Cards Owned" value="23" tone="violet" subtext="7 rare · 2 legendary" />
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <h2>Tokens</h2>
          <span>Collection</span>
        </div>
        <div className="token-list">
          {tokenHoldings.map((token) => (
            <div key={token.symbol} className="token-row">
              <div className={cn("token-mark", accentClassMap[token.accent])}>{token.symbol.slice(0, 1)}</div>
              <div>
                <strong>{token.symbol}</strong>
                <p>{token.amount}</p>
              </div>
              <span>{token.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <h2>Cards</h2>
          <span>Collection</span>
        </div>
        <div className="collection-grid">
          {collectionCards.map((card) => (
            <div key={`${card.name}-${card.rarity}`} className={cn("collection-card", accentClassMap[card.accent])}>
              <div className={cn("rarity-pill", `rarity-${rarityToneMap[card.rarity]}`)}>{card.rarity}</div>
              <strong>{card.name}</strong>
              <span>{card.rarity} card</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-card world-card">
        <div className="panel-heading">
          <h2>Celo World</h2>
          <Crown className="heading-icon" />
        </div>
        <div className="world-grid">
          {[
            { label: "Payments", value: "70%", tone: "cyan" },
            { label: "DeFi", value: "40%", tone: "violet" },
            { label: "Gaming", value: "90%", tone: "green" },
            { label: "Infrastructure", value: "25%", tone: "gold" },
          ].map((item) => (
            <div key={item.label} className={cn("world-node", accentClassMap[item.tone as keyof typeof accentClassMap])}>
              <strong>{item.label}</strong>
              <span>{item.value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SwapTab() {
  return (
    <div className="tab-stack">
      <section className="feature-card deep-space">
        <div>
          <p className="section-chip">Swap</p>
          <h1>Move rewards into CELO or cUSD without exposing the rails.</h1>
          <p>Estimated output, route, fees, and price impact stay visible while the infrastructure stays hidden.</p>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <h2>Available Routes</h2>
          <span>Live preview</span>
        </div>
        <div className="swap-list">
          {swapRoutes.map((route) => (
            <div key={`${route.from}-${route.to}`} className="swap-row">
              <div>
                <strong>
                  {route.from} → {route.to}
                </strong>
                <p>
                  Fee {route.fee} · Price impact {route.impact}
                </p>
              </div>
              <span>{route.output}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="feature-card game-sky compact-banner">
        <div>
          <p className="section-chip">Withdraw</p>
          <h2>Supported assets can be sent straight to MiniPay.</h2>
          <p>Unsupported assets can be converted automatically before send-out.</p>
        </div>
        <Button variant="gold" size="arcadeSm">Prepare Withdraw</Button>
      </section>
    </div>
  );
}

function ProfileTab() {
  return (
    <div className="tab-stack">
      <section className="feature-card purple-flare">
        <div>
          <p className="section-chip">Profile</p>
          <h1>Level 12 Collector</h1>
          <p>Track referrals, progression, discoveries, and leaderboard standing.</p>
        </div>
        <img src={shredLogo.url} alt="Shred profile badge" className="profile-badge" />
      </section>

      <section className="info-grid two-up">
        {profileStats.map((stat) => (
          <MetricCard key={stat.label} label={stat.label} value={stat.value} tone="violet" subtext="" />
        ))}
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <h2>Leaderboard</h2>
          <span>Monthly reset</span>
        </div>
        <div className="leaderboard-list">
          {leaderboard.map((entry) => (
            <div key={entry.rank} className="leaderboard-row">
              <div className="leader-rank">#{entry.rank}</div>
              <div>
                <strong>{entry.name}</strong>
                <p>{entry.level}</p>
              </div>
              <span>{entry.points}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <h2>Discover</h2>
          <span>Projects</span>
        </div>
        <div className="discover-grid">
          {discoverProjects.map((project) => (
            <div key={project.name} className={cn("discover-card", accentClassMap[project.accent])}>
              <p className="section-chip small">{project.category}</p>
              <strong>{project.name}</strong>
              <p>{project.tagline}</p>
              <span>{project.token}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
  subtext,
}: {
  label: string;
  value: string;
  tone: "green" | "gold" | "violet";
  subtext: string;
}) {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <strong className={cn("metric-value", tone === "green" && "metric-green", tone === "gold" && "metric-gold", tone === "violet" && "metric-violet")}>
        {value}
      </strong>
      {subtext ? <p>{subtext}</p> : null}
    </div>
  );
}

function StatPill({ tone, icon, value }: { tone: "gold" | "violet"; icon: string; value: string }) {
  return (
    <div className={cn("stat-pill", tone === "gold" ? "stat-pill-gold" : "stat-pill-violet")}>
      <span>{icon}</span>
      <strong>{value}</strong>
    </div>
  );
}
