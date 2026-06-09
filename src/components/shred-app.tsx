import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, Gift, House, RefreshCw, Sparkles, UserRound, Volume2, VolumeX, WalletCards } from "lucide-react";

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
  profileStats,
  tokenHoldings,
  type NavTab,
  type PackOption,
} from "@/lib/shred-data";
import { openShredPack, enterShred, executeShredSwap } from "@/lib/shred-functions";
import { sfx, isMuted, setMuted } from "@/lib/audio";
import {
  checkUsername,
  claimUsernameOnchain,
  connectWallet,
  getUsernameForAddress,
  isMiniPay,
  getInjectedProvider,
} from "@/lib/celo";
import { quoteSwap, TOKENS, type TokenKey, type SwapQuote } from "@/lib/ubeswap";
import { supabase } from "@/integrations/supabase/client";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import type { Address } from "viem";

type PackKey = PackOption["key"];
type OpeningStep = "confirm" | "opening" | "reveal" | "claimed";
type OpeningReward = { label: string; value: string; accent: "gold" | "green" | "violet" | "cyan" };
type OpeningResult = {
  packKey: PackKey;
  title: string;
  rewards: readonly OpeningReward[];
  claimReady: boolean;
  claimedAt: null;
};
type Session = {
  username: string;
  minipay_address: string;
  shred_wallet_address: string;
};

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

const packGradient: Record<PackOption["accent"], string> = {
  blue: "linear-gradient(160deg, #5fb6ff 0%, #2a6df4 55%, #0b2675 100%)",
  violet: "linear-gradient(160deg, #d57bff 0%, #7a3df0 55%, #2b0a6e 100%)",
  gold: "linear-gradient(160deg, #ffe28a 0%, #f5a623 55%, #6e3b00 100%)",
  dark: "linear-gradient(160deg, #2a2a35 0%, #0d0d12 50%, #050507 100%)",
};

const packAura: Record<PackOption["accent"], string> = {
  blue: "radial-gradient(circle, rgba(122,200,255,0.55), transparent 65%)",
  violet: "radial-gradient(circle, rgba(196,128,255,0.6), transparent 65%)",
  gold: "radial-gradient(circle, rgba(255,210,120,0.65), transparent 65%)",
  dark: "radial-gradient(circle, rgba(255,210,80,0.45), transparent 65%)",
};

export function ShredApp() {
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [selectedPack, setSelectedPack] = useState<PackKey | null>("starter");
  const [openingStep, setOpeningStep] = useState<OpeningStep | null>(null);
  const [openingResult, setOpeningResult] = useState<OpeningResult | null>(null);
  const [revealCount, setRevealCount] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [muted, setMutedState] = useState(false);

  const openPack = useServerFn(openShredPack);

  useEffect(() => {
    setMutedState(isMuted());
  }, []);

  const currentPack = useMemo(
    () => packOptions.find((p) => p.key === (selectedPack ?? "starter")) ?? packOptions[0],
    [selectedPack],
  );

  const handleOpenPack = async () => {
    if (!selectedPack) return;
    sfx.rip();
    setOpeningStep("opening");
    setRevealCount(0);
    const result = await openPack({ data: { packKey: selectedPack } });
    setOpeningResult(result);
    window.setTimeout(() => {
      sfx.explosion();
      setOpeningStep("reveal");
    }, 1500);
  };

  // Sequential reward reveal with sound
  useEffect(() => {
    if (openingStep !== "reveal" || !openingResult) return;
    if (revealCount >= openingResult.rewards.length) return;
    const t = window.setTimeout(() => {
      const r = openingResult.rewards[revealCount];
      if (r.label.toLowerCase().includes("legendary") || r.label.toLowerCase().includes("epic") || r.label.toLowerCase().includes("rare")) {
        sfx.rareReveal();
      } else if (r.label === "CELO" || r.label === "Points") {
        sfx.coin();
      } else {
        sfx.reveal();
      }
      setRevealCount((c) => c + 1);
    }, revealCount === 0 ? 350 : 520);
    return () => window.clearTimeout(t);
  }, [openingStep, openingResult, revealCount]);

  const handleClaim = () => {
    sfx.chest();
    setOpeningStep("claimed");
    window.setTimeout(() => sfx.success(), 400);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) sfx.click();
  };

  return (
    <main className="shred-shell">
      <div className="shred-frame">
        <div className="screen-glow" aria-hidden="true" />
        <div className="screen-stars" aria-hidden="true" />

        <button type="button" className="mute-toggle" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>

        {!session ? (
          <WelcomeScreen onEntered={setSession} />
        ) : (
          <>
            <header className="top-bar">
              <div className="player-chip">
                <div className="avatar-ring">
                  <img src={shredLogo.url} alt="Shred player avatar" className="avatar-logo" />
                </div>
                <div>
                  <p className="level-badge">Level 12</p>
                  <h2>{session.username}</h2>
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
              {activeTab === "home" && (
                <HomeTab
                  onOpenStarter={() => {
                    sfx.packSelect();
                    setSelectedPack("starter");
                    setOpeningStep("confirm");
                  }}
                />
              )}
              {activeTab === "shreds" && (
                <ShredsTab
                  selectedPack={selectedPack}
                  onSelectPack={(pack) => {
                    sfx.packSelect();
                    setSelectedPack(pack);
                  }}
                  onOpen={() => {
                    sfx.click();
                    setOpeningStep("confirm");
                  }}
                />
              )}
              {activeTab === "collection" && <CollectionTab />}
              {activeTab === "swap" && <SwapTab />}
              {activeTab === "profile" && <ProfileTab session={session} />}
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
                    onClick={() => {
                      sfx.navTap();
                      setActiveTab(item.key);
                    }}
                  >
                    <span className={cn("nav-icon-wrap", isActive && "nav-icon-wrap-active")}>
                      <Icon className="nav-icon" />
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <AnimatePresence>
              {openingStep ? (
                <motion.div
                  className="overlay-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="overlay-card"
                    initial={{ scale: 0.9, y: 30 }}
                    animate={openingStep === "opening"
                      ? { scale: 1, y: 0, x: [0, -6, 6, -4, 4, 0], rotate: [0, -1, 1, -0.6, 0.6, 0] }
                      : { scale: 1, y: 0 }}
                    transition={openingStep === "opening" ? { duration: 1.5, repeat: 0 } : { type: "spring", stiffness: 220, damping: 22 }}
                    exit={{ scale: 0.92, opacity: 0 }}
                  >
                    {openingStep === "confirm" && (
                      <ConfirmPanel pack={currentPack} onOpen={handleOpenPack} onClose={() => setOpeningStep(null)} />
                    )}
                    {openingStep === "opening" && <OpeningScene pack={currentPack} />}
                    {openingStep === "reveal" && openingResult && (
                      <RevealScene
                        pack={currentPack}
                        result={openingResult}
                        revealedCount={revealCount}
                        onClaim={handleClaim}
                      />
                    )}
                    {openingStep === "claimed" && openingResult && (
                      <ClaimedScene
                        result={openingResult}
                        onClose={() => {
                          sfx.click();
                          setActiveTab("collection");
                          setOpeningStep(null);
                        }}
                      />
                    )}
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </>
        )}
      </div>
    </main>
  );
}

/* ----------------------- Welcome / Username claim ---------------------- */

function WelcomeScreen({ onEntered }: { onEntered: (s: Session) => void }) {
  const [step, setStep] = useState<"idle" | "claim">("idle");
  return (
    <section className="welcome-panel">
      <motion.img
        src={shredLogo.url}
        alt="Shred logo"
        className="welcome-logo"
        initial={{ scale: 0.7, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 14 }}
      />
      <div className="welcome-copy">
        <h1>Welcome to Shred</h1>
        <p>Claim your name. Open packs. Collect the Celo ecosystem.</p>
      </div>
      <Button
        variant="arcade"
        size="arcade"
        onClick={() => {
          sfx.click();
          setStep("claim");
        }}
      >
        Claim Username
      </Button>
      {step === "claim" ? <ClaimUsernameModal onClose={() => setStep("idle")} onEntered={onEntered} /> : null}
    </section>
  );
}

function ClaimUsernameModal({ onEntered, onClose }: { onEntered: (s: Session) => void; onClose: () => void }) {
  const enter = useServerFn(enterShred);
  const [stage, setStage] = useState<"connect" | "name" | "claiming" | "entering" | "done">("connect");
  const [address, setAddress] = useState<Address | null>(null);
  const [existing, setExisting] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const checkRef = useRef<number | null>(null);

  const startConnect = async () => {
    setError(null);
    try {
      if (!getInjectedProvider()) {
        // Preview/browser fallback: create a local burner so signup still works.
        const burner = privateKeyToAccount(generatePrivateKey()).address;
        setAddress(burner);
        setStage("name");
        return;
      }
      const addr = await connectWallet();
      setAddress(addr);
      const already = await getUsernameForAddress(addr);
      if (already) {
        setExisting(already);
        setName(already);
        setStage("entering");
        await enterFlow(addr, already);
      } else {
        setStage("name");
      }
    } catch (e) {
      sfx.error();
      setError(e instanceof Error ? e.message : "Could not connect wallet");
    }
  };

  const enterFlow = async (addr: Address, username: string, txHash?: string) => {
    setStage("entering");
    setStatusText("Setting up your collection wallet…");
    const res = await enter({ data: { address: addr, username, txHash } });
    await supabase.auth.setSession({ access_token: res.access_token, refresh_token: res.refresh_token });
    sfx.success();
    setStage("done");
    onEntered({ username: res.username, minipay_address: res.minipay_address, shred_wallet_address: res.shred_wallet_address });
  };

  // Debounced availability check
  useEffect(() => {
    if (stage !== "name") return;
    setAvailable(null);
    setError(null);
    if (!name) return;
    if (checkRef.current) window.clearTimeout(checkRef.current);
    checkRef.current = window.setTimeout(async () => {
      const r = await checkUsername(name);
      setAvailable(r.available);
      if (!r.available) setError(r.reason ?? null);
    }, 380);
    return () => {
      if (checkRef.current) window.clearTimeout(checkRef.current);
    };
  }, [name, stage]);

  const submitClaim = async () => {
    if (!address || !name || available !== true) return;
    sfx.click();
    setStage("claiming");
    setError(null);
    try {
      if (!getInjectedProvider()) {
        setStatusText("Provisioning your Shred wallet…");
        await enterFlow(address, name);
        return;
      }
      setStatusText("Confirm in your wallet…");
      const tx = await claimUsernameOnchain(name, address);
      setStatusText("Waiting for confirmation…");
      await enterFlow(address, name, tx);
    } catch (e) {
      sfx.error();
      setError(e instanceof Error ? e.message : "Claim failed");
      setStage("name");
    }
  };

  return (
    <motion.div
      className="overlay-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="overlay-card claim-modal"
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
      >
        <p className="eyebrow">{stage === "connect" ? "Step 1" : stage === "name" ? "Step 2" : "Almost there"}</p>
        {stage === "connect" && (
          <>
            <h3>Connect to Shred</h3>
            <p>{isMiniPay() ? "We detected MiniPay. Connect to continue." : "Open Shred inside MiniPay for the best experience."}</p>
            <Button variant="arcade" size="arcade" onClick={startConnect}>Connect Wallet</Button>
          </>
        )}
        {stage === "name" && (
          <>
            <h3>Pick your name</h3>
            <p>This becomes your onchain Shred identity. 3–20 characters.</p>
            <input
              className="username-input"
              value={name}
              onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20))}
              placeholder="yourname"
              autoFocus
            />
            <div className={cn("availability", available === true && "ok", available === false && "bad")}>
              {!name ? "Letters, numbers, underscore." : available === null ? "Checking…" : available ? "Available!" : (error ?? "Taken")}
            </div>
            <Button variant="gold" size="arcade" disabled={available !== true} onClick={submitClaim}>
              Claim Onchain
            </Button>
          </>
        )}
        {(stage === "claiming" || stage === "entering") && (
          <div className="claiming-scene">
            <motion.img
              src={shredLogo.url}
              alt=""
              className="claim-logo"
              animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            <h3>{stage === "claiming" ? "Claiming on Celo…" : "Welcome aboard"}</h3>
            <p>{statusText}</p>
          </div>
        )}
        {stage === "done" && existing && <p>Welcome back, {existing}.</p>}
        {error && stage !== "name" ? <p className="welcome-note">{error}</p> : null}
        {stage === "connect" || stage === "name" ? (
          <button type="button" className="ghost-close" onClick={onClose}>Not now</button>
        ) : null}
      </motion.div>
    </motion.div>
  );
}

/* ----------------------- Pack visuals ---------------------- */

function ShredPack({ pack, size = "lg" }: { pack: PackOption; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: 96, md: 140, lg: 200 } as const;
  const w = sizes[size];
  return (
    <div className="shred-pack-wrap" style={{ width: w, height: Math.round(w * 1.32) }}>
      <div className="shred-pack-aura" style={{ background: packAura[pack.accent] }} aria-hidden="true" />
      <motion.div
        className="shred-pack-body"
        style={{ background: packGradient[pack.accent] }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="shred-pack-shine" aria-hidden="true" />
        <div className="shred-pack-foil" aria-hidden="true" />
        <img src={shredLogo.url} alt="" className="shred-pack-emblem" />
        <span className="shred-pack-name">SHRED</span>
        <span className="shred-pack-tier">{pack.tagline}</span>
        {pack.accent === "dark" ? <div className="shred-pack-lightning" aria-hidden="true" /> : null}
      </motion.div>
    </div>
  );
}

function ParticleBurst({ count = 28 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        angle: (i / count) * Math.PI * 2 + Math.random() * 0.4,
        distance: 90 + Math.random() * 80,
        size: 6 + Math.random() * 10,
        delay: Math.random() * 0.2,
        hue: ["#ffd166", "#ef476f", "#06d6a0", "#118ab2", "#c77dff"][i % 5],
      })),
    [count],
  );
  return (
    <div className="particle-field" aria-hidden="true">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="particle"
          style={{ width: p.size, height: p.size, background: p.hue }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            opacity: 0,
            scale: 1.2,
          }}
          transition={{ duration: 1.1, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/* ----------------------- Pack-open overlay scenes ---------------------- */

function ConfirmPanel({ pack, onOpen, onClose }: { pack: PackOption; onOpen: () => void; onClose: () => void }) {
  return (
    <>
      <div className="pack-hero-stage">
        <ShredPack pack={pack} size="lg" />
      </div>
      <div className="overlay-text">
        <p className="eyebrow">{pack.rarityHint}</p>
        <h3>{pack.name}</h3>
        <p>{pack.blurb}</p>
      </div>
      <div className="overlay-actions">
        <div>
          <p className="overlay-label">Cost</p>
          <strong>{pack.price}</strong>
        </div>
        <Button variant="arcade" size="arcade" onClick={onOpen}>Open Pack</Button>
      </div>
      <button type="button" className="ghost-close" onClick={onClose}>Not now</button>
    </>
  );
}

function OpeningScene({ pack }: { pack: PackOption }) {
  return (
    <div className="opening-scene">
      <p className="eyebrow">Shredding!</p>
      <div className="pack-hero-stage">
        <motion.div
          animate={{ rotate: [0, -8, 8, -10, 10, 0], scale: [1, 1.05, 0.96, 1.08, 0.95, 1] }}
          transition={{ duration: 1.5 }}
        >
          <ShredPack pack={pack} size="lg" />
        </motion.div>
        <ParticleBurst count={20} />
      </div>
      <p>Cracking your pack open…</p>
    </div>
  );
}

function RevealScene({
  pack,
  result,
  revealedCount,
  onClaim,
}: {
  pack: PackOption;
  result: OpeningResult;
  revealedCount: number;
  onClaim: () => void;
}) {
  const allRevealed = revealedCount >= result.rewards.length;
  return (
    <>
      <div className="reveal-header">
        <p className="eyebrow">{pack.name} · Rewards</p>
        <h3>{result.title}</h3>
      </div>
      <div className="reveal-stage">
        <ParticleBurst count={14} />
      </div>
      <div className="reward-grid">
        {result.rewards.map((reward, idx) => (
          <AnimatePresence key={reward.label} mode="popLayout">
            {idx < revealedCount ? (
              <motion.div
                className={cn("reward-tile", accentClassMap[reward.accent], textClassMap[reward.accent])}
                initial={{ scale: 0.4, rotate: -10, opacity: 0, y: 30 }}
                animate={{ scale: 1, rotate: 0, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
              >
                <span className="reward-value">{reward.value}</span>
                <strong>{reward.label}</strong>
              </motion.div>
            ) : (
              <div key={`ph-${idx}`} className="reward-tile reward-placeholder">?</div>
            )}
          </AnimatePresence>
        ))}
      </div>
      <Button variant="gold" size="arcade" disabled={!allRevealed} onClick={onClaim}>
        {allRevealed ? "Claim Rewards" : "Revealing…"}
      </Button>
    </>
  );
}

function ClaimedScene({ result, onClose }: { result: OpeningResult; onClose: () => void }) {
  return (
    <div className="claim-scene">
      <ParticleBurst count={28} />
      <motion.div className="claim-badge" initial={{ scale: 0.6 }} animate={{ scale: [0.6, 1.15, 1] }} transition={{ duration: 0.6 }}>
        Success!
      </motion.div>
      <motion.img
        src={shredLogo.url}
        alt="Shred logo badge"
        className="claim-logo"
        animate={{ rotate: [0, -6, 6, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      />
      <p>Added to your collection. Cash out anytime from the Swap tab.</p>
      <div className="claim-summary">
        {result.rewards.map((reward) => (
          <div key={reward.label} className="claim-row">
            <span>{reward.label}</span>
            <strong>{reward.value}</strong>
          </div>
        ))}
      </div>
      <Button variant="arcade" size="arcade" onClick={onClose}>View Collection</Button>
    </div>
  );
}

/* ----------------------- Tabs ---------------------- */

function HomeTab({ onOpenStarter }: { onOpenStarter: () => void }) {
  return (
    <div className="tab-stack">
      <section className="hero-card game-sky">
        <div className="hero-copy">
          <p className="eyebrow">Daily Shred Ready</p>
          <h1>Today's free pack is waiting.</h1>
          <p>Discover ecosystem rewards every 24 hours.</p>
          <Button variant="arcade" size="arcade" onClick={onOpenStarter}>Shred Now</Button>
        </div>
        <div className="hero-pack-mini">
          <ShredPack pack={packOptions[0]} size="sm" />
        </div>
      </section>

      <section className="info-grid three-up">
        <MetricCard label="Value" value="$24.21" tone="green" subtext="Cards + tokens" />
        <MetricCard label="Points" value="4,350" tone="gold" subtext="Level 12" />
        <MetricCard label="Complete" value="57%" tone="violet" subtext="7 rare · 2 legendary" />
      </section>

      <section className="panel-card">
        <div className="panel-heading"><h2>Daily Quests</h2><span>3/5</span></div>
        <div className="quest-list">
          {dailyQuests.map((quest) => (
            <div key={quest.title} className="quest-row">
              <div className="quest-icon">{quest.icon}</div>
              <div className="quest-copy">
                <strong>{quest.title}</strong>
                <div className="progress-bar"><span style={{ width: `${quest.progress * 100}%` }} /></div>
              </div>
              <span className="quest-reward">{quest.reward}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-heading"><h2>Latest Discovery</h2><Sparkles className="heading-icon" /></div>
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
          <h1>Open packs. Collect everything.</h1>
          <p>Every Shred moves your collection forward.</p>
        </div>
      </section>

      <section className="pack-grid">
        {packOptions.map((pack) => {
          const isSelected = selectedPack === pack.key;
          return (
            <motion.button
              type="button"
              key={pack.key}
              whileTap={{ scale: 0.96 }}
              onMouseEnter={() => sfx.hover()}
              className={cn("pack-card", ringClassMap[pack.accent], isSelected && "pack-card-selected")}
              onClick={() => onSelectPack(pack.key)}
            >
              <div className="pack-card-stage">
                <ShredPack pack={pack} size="md" />
              </div>
              <div className="pack-card-copy">
                <h3>{pack.name}</h3>
                <p>{pack.blurb}</p>
              </div>
              <div className="pack-card-footer">
                <strong>{pack.price}</strong>
                <span>{pack.rarityHint}</span>
              </div>
            </motion.button>
          );
        })}
      </section>

      <section className="feature-card game-sky compact-banner">
        <div>
          <p className="section-chip">Ready?</p>
          <h2>Open the selected pack.</h2>
        </div>
        <Button variant="gold" size="arcade" onClick={onOpen}>Open</Button>
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
        <div className="panel-heading"><h2>Tokens</h2><span>Inventory</span></div>
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
        <div className="panel-heading"><h2>Cards</h2><span>Inventory</span></div>
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
        <div className="panel-heading"><h2>Celo World</h2><Crown className="heading-icon" /></div>
        <div className="world-grid">
          {[
            { label: "Payments", value: "70%", tone: "cyan" },
            { label: "DeFi", value: "40%", tone: "violet" },
            { label: "Gaming", value: "90%", tone: "green" },
            { label: "Infra", value: "25%", tone: "gold" },
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
  const exec = useServerFn(executeShredSwap);
  const [from, setFrom] = useState<TokenKey>("CELO");
  const [to, setTo] = useState<TokenKey>("cUSD");
  const [amount, setAmount] = useState("1");
  const [slippage, setSlippage] = useState(0.5);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [quoteErr, setQuoteErr] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ txHash: string } | { error: string } | null>(null);

  useEffect(() => {
    setQuote(null);
    setQuoteErr(null);
    if (!amount || Number(amount) <= 0 || from === to) return;
    const t = window.setTimeout(async () => {
      setQuoting(true);
      try {
        const q = await quoteSwap(from, to, amount, slippage);
        setQuote(q);
      } catch (e) {
        setQuoteErr(e instanceof Error ? e.message : "No route");
      } finally {
        setQuoting(false);
      }
    }, 350);
    return () => window.clearTimeout(t);
  }, [from, to, amount, slippage]);

  const submit = async () => {
    if (!quote) return;
    setSubmitting(true);
    setResult(null);
    try {
      sfx.click();
      const res = await exec({
        data: {
          fromSymbol: from,
          toSymbol: to,
          amountIn: amount,
          minAmountOut: quote.minOut,
          path: quote.path.map((k) => TOKENS[k].address),
        },
      });
      sfx.success();
      setResult({ txHash: res.txHash });
    } catch (e) {
      sfx.error();
      setResult({ error: e instanceof Error ? e.message : "Swap failed" });
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  };

  return (
    <div className="tab-stack">
      <section className="feature-card deep-space">
        <div>
          <p className="section-chip">Cash Out</p>
          <h1>Convert your rewards.</h1>
          <p>Live Ubeswap routes. Quote, confirm, and cash out to CELO or cUSD.</p>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-heading"><h2>Swap</h2><span>Ubeswap V2</span></div>

        <div className="swap-form">
          <label className="swap-field">
            <span>From</span>
            <div className="swap-row-input">
              <select value={from} onChange={(e) => setFrom(e.target.value as TokenKey)}>
                {Object.keys(TOKENS).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
              />
            </div>
          </label>
          <button
            type="button"
            className="swap-flip"
            onClick={() => { const f = from; setFrom(to); setTo(f); }}
            aria-label="Flip tokens"
          >⇅</button>
          <label className="swap-field">
            <span>To</span>
            <div className="swap-row-input">
              <select value={to} onChange={(e) => setTo(e.target.value as TokenKey)}>
                {Object.keys(TOKENS).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <strong className="swap-out">
                {quoting ? "…" : quote ? Number(quote.amountOut).toFixed(6) : "—"}
              </strong>
            </div>
          </label>

          <div className="swap-meta">
            <div><span>Route</span><strong>{quote ? quote.path.join(" → ") : "—"}</strong></div>
            <div><span>Fee</span><strong>{quote ? `${quote.feePct.toFixed(2)}%` : "—"}</strong></div>
            <div><span>Price impact</span><strong>{quote ? `${quote.priceImpactPct.toFixed(2)}%` : "—"}</strong></div>
            <div><span>Min received</span><strong>{quote ? `${Number(quote.minOut).toFixed(6)} ${to}` : "—"}</strong></div>
            <div><span>Router</span><strong>{quote?.routerDisplay ?? "—"}</strong></div>
          </div>

          <div className="swap-slippage">
            <span>Slippage</span>
            {[0.1, 0.5, 1].map((s) => (
              <button
                type="button"
                key={s}
                className={cn("slip-chip", slippage === s && "slip-chip-active")}
                onClick={() => setSlippage(s)}
              >{s}%</button>
            ))}
          </div>

          {quoteErr ? <p className="swap-error">{quoteErr}</p> : null}

          <Button
            variant="gold"
            size="arcade"
            disabled={!quote || quoting}
            onClick={() => { sfx.click(); setConfirming(true); }}
          >Review Cash Out</Button>
        </div>
      </section>

      <AnimatePresence>
        {confirming && quote ? (
          <motion.div className="overlay-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="overlay-card claim-modal" initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }}>
              <p className="eyebrow">Confirm Cash Out</p>
              <h3>{amount} {from} → {Number(quote.amountOut).toFixed(6)} {to}</h3>
              <div className="claim-summary">
                <div className="claim-row"><span>Route</span><strong>{quote.path.join(" → ")}</strong></div>
                <div className="claim-row"><span>Fee</span><strong>{quote.feePct.toFixed(2)}%</strong></div>
                <div className="claim-row"><span>Price impact</span><strong>{quote.priceImpactPct.toFixed(2)}%</strong></div>
                <div className="claim-row"><span>Slippage</span><strong>{quote.slippagePct}%</strong></div>
                <div className="claim-row"><span>Min received</span><strong>{Number(quote.minOut).toFixed(6)} {to}</strong></div>
              </div>
              {result && "error" in result ? <p className="swap-error">{result.error}</p> : null}
              {result && "txHash" in result ? (
                <p className="welcome-note">Cashed out · tx {result.txHash.slice(0, 10)}…</p>
              ) : null}
              <Button variant="arcade" size="arcade" disabled={submitting} onClick={submit}>
                {submitting ? "Signing & sending…" : "Sign & Send"}
              </Button>
              <button type="button" className="ghost-close" onClick={() => { setConfirming(false); setResult(null); }}>
                Close
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ProfileTab({ session }: { session: Session }) {
  return (
    <div className="tab-stack">
      <section className="feature-card purple-flare">
        <div>
          <p className="section-chip">Profile</p>
          <h1>{session.username}</h1>
          <p>Level 12 · Collector tier</p>
        </div>
        <img src={shredLogo.url} alt="Shred profile badge" className="profile-badge" />
      </section>

      <section className="info-grid two-up">
        {profileStats.map((stat) => (
          <MetricCard key={stat.label} label={stat.label} value={stat.value} tone="violet" subtext="" />
        ))}
      </section>

      <section className="panel-card">
        <div className="panel-heading"><h2>Leaderboard</h2><span>Monthly</span></div>
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
        <div className="panel-heading"><h2>Discover</h2><span>Projects</span></div>
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

function MetricCard({ label, value, tone, subtext }: { label: string; value: string; tone: "green" | "gold" | "violet"; subtext: string }) {
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
