# PARADOX — A Behavioral Liquidity Experiment on Polygon

> "The protocol does not promise returns. It asks participants what they are willing to sacrifice. Markets answer honestly."

---

## Deployment Wallet

**Address:** `0x565FE810c622882C623d4bB6e8A90EAf1db23f47`

> ⚡ **Send 0.5–1 MATIC to this address to fund deployment.**  
> Full wallet details (including private key) are in `wallet.txt` — keep this file secure, never share or commit.

---

## Quick Deploy

### Option A — Auto-watcher (recommended)
```bash
cd contracts
npm run watch-deploy
# Fund the wallet above, deployment triggers automatically
```

### Option B — Manual (after funding)
```bash
cd contracts
cp .env.example .env       # already populated — review allocations
npm run deploy:polygon
```

### Option C — Testnet first (Mumbai)
```bash
cd contracts
npm run deploy:mumbai
```

---

## Project Structure

```
paradox/
├── wallet.txt                       ← Deployment wallet (KEEP SECURE)
├── contracts/
│   ├── contracts/
│   │   ├── ParadoxToken.sol         ← ERC-20, 1B PRDX, no tax, no mint
│   │   ├── BurnReputationNFT.sol    ← Soulbound ERC-721, 4 conviction tiers
│   │   ├── EpochController.sol      ← Epoch engine, CCI, hoard/burn/exit
│   │   └── TokenVesting.sol         ← 24-month linear vesting (dev)
│   ├── scripts/
│   │   ├── deploy.js                ← Full deployment sequence
│   │   └── watch-and-deploy.js      ← Auto-deploy on funding
│   ├── hardhat.config.js
│   └── .env                         ← Private key + RPC (gitignored)
└── frontend/
    └── src/
        ├── components/              ← Hero, LiveStats, EpochSection, etc.
        ├── hooks/useParadox.js      ← wagmi hooks for live on-chain data
        └── contracts/addresses.js  ← UPDATE after deployment
```

---

## After Deployment

1. **Update frontend addresses** — `contracts/scripts/deploy.js` writes them automatically to `frontend/src/contracts/addresses.js`

2. **Verify on Polygonscan**
   ```bash
   cd contracts
   npx hardhat verify --network polygon <ParadoxToken_address> <arg1> <arg2> ...
   ```

3. **Lock liquidity** — Use Unicrypt or UNCX on Polygon for LP lock

4. **Add Polygonscan API key** to `contracts/.env` for verification:
   ```
   POLYGONSCAN_API_KEY=your_key_from_polygonscan.com
   ```

5. **Build & deploy frontend**
   ```bash
   cd frontend
   npm run build
   # Deploy dist/ to Vercel, Netlify, or IPFS
   ```

---

## Tokenomics

| Allocation          | %  | Amount          |
|---------------------|----|-----------------|
| Fair Launch LP      | 50 | 500,000,000     |
| Epoch Reward Reserve| 20 | 200,000,000     |
| Dev (24mo vesting)  | 15 | 150,000,000     |
| DAO Treasury        | 10 | 100,000,000     |
| Ecosystem Grants    |  5 |  50,000,000     |

No transaction tax · No hidden mint · No blacklist

---

## Contract Architecture

| Contract           | Role                                                        |
|--------------------|-------------------------------------------------------------|
| `ParadoxToken`     | ERC-20 PRDX — fixed 1B supply, burn functions               |
| `BurnReputationNFT`| Soulbound ERC-721 — minted on burn, records tier + score   |
| `EpochController`  | 30-day epochs, CCI, hoard/burn/exit, reward distribution   |
| `TokenVesting`     | Linear 24-month dev vesting                                |

---

## Security Notes

- Independent audit recommended before broad promotion
- Dev allocation locked in `TokenVesting` from day 1
- `epochControllerSet` flag prevents controller from being re-assigned
- No admin mint function on token contract
- All contract interactions are on-chain and verifiable
