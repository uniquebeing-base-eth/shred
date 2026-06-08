# Shred Contracts

Two minimal MVP contracts on Celo (chain id 42220):

- `ShredRewards.sol` — Backend-controlled distributor. Funded with CELO and ecosystem ERC20s (MENTO, UBE, GOOD, MOBI). Calls `distribute(claimId, player, packKey, celoAmount, tokens, amounts)` to atomically pay a player's app-managed Shred wallet when a pack is opened. `claimId` is replay-protected.
- `ShredPayments.sol` — Collects user payments for paid Shreds. Supports native CELO and any approved ERC20 (e.g. cUSD `0x765DE816845861e75A25fCA122bb6898B8B1282a`). Forwards funds to a treasury address and emits `PackPurchased` for backend reconciliation.

Both are intentionally small, gas-cheap, and auditable. Deploy with your tool of choice (Hardhat / Foundry / Remix). After deploy, add the addresses to project secrets:

```
SHRED_REWARDS_ADDRESS=0x...
SHRED_PAYMENTS_ADDRESS=0x...
```

Then call `setRewarder(backendSigner, true)` on `ShredRewards`, and `setPackEnabled` + `setPrice` for packKeys 2,3,4 on `ShredPayments`.

Username registry already deployed at `0xb1CE5a24ab458a8Fde04e0DF9Bfe86908515c90b` (FlashUsernameRegistry).
