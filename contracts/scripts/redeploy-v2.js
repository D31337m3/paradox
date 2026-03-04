// scripts/redeploy-v2.js
// Deploys BurnReputationNFTv2 + EpochControllerV2 and wires them up.
// ParadoxToken and TokenVesting are UNCHANGED — same addresses.
// The old EpochController (v1) remains live so existing hoarders can reclaim after epoch 0 ends.

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const TOKEN_ADDR   = "0x4F70E7790804A47590DCDB4d3A3C4Ecd8c529d09";
const OLD_EC_ADDR  = "0x1fb3c47c85f65daaF4a48B27E3D9F9dd8607a88e";
const OLD_NFT_ADDR = "0xE6de4639FBaa59C7f24c11f8f078515e449C035F";
const VESTING_ADDR = "0x75812E84490a06C5D81B31862c8AF0c5F6b436B7";

// Fund new EC with 20M PDX from deployer wallet as initial reward pool
const REWARD_FUND = ethers.parseEther("20000000");
const INIT_EMISSION = ethers.parseEther("2000000");  // 2M per epoch
const EMISSION_FLOOR = ethers.parseEther("500000");  // 0.5M min
const EMISSION_CEIL  = ethers.parseEther("10000000"); // 10M max

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const matic = await ethers.provider.getBalance(deployer.address);
  console.log("MATIC balance:", ethers.formatEther(matic));

  const token = await ethers.getContractAt("ParadoxToken", TOKEN_ADDR, deployer);
  const pdxBal = await token.balanceOf(deployer.address);
  console.log("Deployer PDX:", ethers.formatEther(pdxBal));

  if (pdxBal < REWARD_FUND) {
    throw new Error(`Insufficient PDX: need 20M, have ${ethers.formatEther(pdxBal)}M`);
  }

  // ── 1. Deploy BurnReputationNFTv2 (SVGGenerator inlined) ──────────────────
  console.log("\n[1/5] Deploying BurnReputationNFTv2...");
  const NFTFactory = await ethers.getContractFactory("BurnReputationNFTv2");
  const nftV2 = await NFTFactory.deploy();
  await nftV2.waitForDeployment();
  const nftV2Addr = await nftV2.getAddress();
  console.log("BurnReputationNFTv2:", nftV2Addr);

  // ── 2. Deploy EpochControllerV2 ────────────────────────────────────────────
  console.log("\n[2/5] Deploying EpochControllerV2...");
  const ECFactory = await ethers.getContractFactory("EpochControllerV2");
  const ecV2 = await ECFactory.deploy(
    TOKEN_ADDR, nftV2Addr, INIT_EMISSION, EMISSION_FLOOR, EMISSION_CEIL
  );
  await ecV2.waitForDeployment();
  const ecV2Addr = await ecV2.getAddress();
  console.log("EpochControllerV2:", ecV2Addr);

  // ── 3. Wire up NFT → new EC ────────────────────────────────────────────────
  console.log("\n[3/5] Setting epoch controller on NFTv2...");
  const tx1 = await nftV2.setEpochController(ecV2Addr);
  await tx1.wait();
  console.log("NFTv2 epochController =", ecV2Addr);

  // ── 4. Fund new EC with 20M PDX reward pool ────────────────────────────────
  console.log("\n[4/5] Transferring 20M PDX to EpochControllerV2...");
  const tx2 = await token.transfer(ecV2Addr, REWARD_FUND);
  await tx2.wait();
  const ecBal = await token.balanceOf(ecV2Addr);
  console.log("EpochControllerV2 PDX balance:", ethers.formatEther(ecBal));

  // ── 5. Start epoch 0 on new EC ─────────────────────────────────────────────
  console.log("\n[5/5] Starting epoch 0 on EpochControllerV2...");
  const tx3 = await ecV2.startFirstEpoch();
  await tx3.wait();
  const ep0 = await ecV2.getEpoch(0);
  console.log("Epoch 0 started. End time:", new Date(Number(ep0.endTime) * 1000).toISOString());
  console.log("Epoch 0 emission:", ethers.formatEther(ep0.emission), "PDX");

  // ── Write addresses ─────────────────────────────────────────────────────────
  const addresses = {
    PDX_TOKEN:          TOKEN_ADDR,
    BURN_REPUTATION_NFT: nftV2Addr,
    EPOCH_CONTROLLER:   ecV2Addr,
    TOKEN_VESTING:      VESTING_ADDR,
    OLD_EPOCH_CONTROLLER: OLD_EC_ADDR,
    OLD_NFT:            OLD_NFT_ADDR,
    DEPLOYER:           deployer.address,
    LP_PAIR_QUICKSWAP:  "0x4d35Ee91Cc47e108F9f21a1551345cce93817B9E",
  };

  const addrText = Object.entries(addresses)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  fs.writeFileSync(
    path.join(__dirname, "../../ADDRESSES.txt"),
    addrText + "\n"
  );
  console.log("\n✓ ADDRESSES.txt updated");

  console.log("\n═══════════════════════════════════════");
  console.log("V2 DEPLOYMENT COMPLETE");
  console.log("═══════════════════════════════════════");
  console.log("PDX Token (unchanged):", TOKEN_ADDR);
  console.log("BurnReputationNFTv2:  ", nftV2Addr);
  console.log("EpochControllerV2:    ", ecV2Addr);
  console.log("\nNOTE: Old EC v1 (", OLD_EC_ADDR, ")");
  console.log("still holds 200M locked hoard + 200M reward pool.");
  console.log("Epoch 0 participants can reclaimTokens() from it after it ends.");
  console.log("Update frontend addresses.js with new NFT + EC addresses.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
